#When running webapp, remmeber to add uvicorn backend.main:app --reload 

#Main web methods with http, Get=Read, Post=Create, Put=Update, Delete=Delete
#Pydantic is for data validation
#Use swagger for better UI for data management, use localhost:8000/docs


from fastapi import FastAPI, HTTPException, Header, Depends
#from backend.models import Product
from BackEnd.models import Student
from BackEnd.models import Reminder
from BackEnd.firebaseConfig import db
from BackEnd.models import AdminMetrics

from firebase_admin import auth as firebase_auth

from customerio import CustomerIO
import os
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

app = FastAPI()


# Allow react and fast.api to communicate
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize customer.io for auto emails
cio = CustomerIO(
    site_id=os.getenv("CUSTOMERIO_SITE_ID"),
    api_key=os.getenv("CUSTOMER_API_KEY")
)

#Bakcend Logic
def verify_token(authorization: str = Header(None)):
    """
    Verifies Firebase ID token from Authorization header
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    # Expecting header: "Bearer <token>"
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def checkInactiveStudents():
    """
    Checks for students inactive for more than 7 days, sends emails via CustomerIO,
    and returns the number of emails actually sent.
    """
    emails_sent = 0

    try:
        studentsRef = db.collection("studentData").stream()

        for doc in studentsRef:
            studentData = doc.to_dict()
            lastActive = studentData.get("lastActive", 0)

            if lastActive > 7:
                # Send email via CustomerIO
                cio.track(
                    customer_id=studentData.get("email"),
                    name="inactiveStudent",
                    **{
                        "studentName": studentData.get("name"),
                        "daysInactive": lastActive,
                        "applicationStatus": studentData.get("applicationStatus")
                    }
                )

                emails_sent += 1  # increment counter
                print(f"Sent inactive email to {studentData.get('name')}")

    except Exception as e:
        print(f"Error checking inactive students: {e}")

    return emails_sent  # return the number of emails sent


def calculate_admin_score(metrics: dict) -> int:
    """
    Compute weighted score:
    - activeContacts7Days * 3
    - remindersCreated * 2
    - profileUpdates * 1
    - followUpsSent * 3
    """
    return (
        metrics.get("activeContacts7Days", 0) * 4 +
        metrics.get("remindersCreated", 0) * 1 +
        metrics.get("profileUpdates", 0) * 3 +
        metrics.get("followUpsSent", 0) * 3
    )
 


# End Points
@app.get("/students")
def get_students():
    studentsRef = db.collection("studentData")
    docs = studentsRef.stream()
    data = [doc.to_dict() | {"id": doc.id} for doc in docs]
    return {"students": data}

@app.get("/students/{studentId}")
def getStudent(studentId: str):
    docRef = db.collection("studentData").document(studentId)
    doc = docRef.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student Not Found")
    return {"id": doc.id, **doc.to_dict()}

@app.post("/students")
def create_student(student: Student, user=Depends(verify_token)):
    # Convert incoming Student to dict
    student_data = student.dict()
    
    # Remove userId if it exists (frontend shouldn’t send it)
    student_data.pop("userId", None)
    
    # Attach the logged-in admin's UID
    student_data["userId"] = user.get("uid")
    
    # Add to Firebase
    docRef = db.collection("studentData").add(student_data)
    return {"id": docRef[1].id, "message": "Student created"}


@app.post("/students-debug")
def create_student_debug(student: dict, user=Depends(verify_token)):
    print("Incoming student data:", student)
    return {"received": student}

@app.put("/students/{student_id}")
def update_student(student_id: str, student: Student, user=Depends(verify_token)):
    try:
        # Convert to dict and remove userId (same security as create)
        student_data = student.dict()
        student_data.pop("userId", None)
        student_data["userId"] = user.get("uid")
        
        # Update the document in Firebase
        db.collection("studentData").document(student_id).update(student_data)

        # --- Update admin metrics: profileUpdates ---
        admin_id = user.get("uid")
        doc = db.collection("adminMetrics").document(admin_id).get()
        existing_metrics = doc.to_dict() if doc.exists else {}
        updated_metrics = {**existing_metrics, "profileUpdates": existing_metrics.get("profileUpdates",0)+1}
        updated_metrics["score"] = calculate_admin_score(updated_metrics)
        updated_metrics["lastUpdated"] = datetime.utcnow()
        db.collection("adminMetrics").document(admin_id).set(updated_metrics)
        # --- End metrics update ---
        
        return {"message": "Student updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update student: {str(e)}")

@app.delete("/students/{student_id}")
def delete_student(student_id: str, user=Depends(verify_token)):
    try:
        # First verify the student belongs to this admin
        doc = db.collection("studentData").document(student_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student_data = doc.to_dict()
        if student_data.get("userId") != user.get("uid"):
            raise HTTPException(status_code=403, detail="Not authorized to delete this student")
        
        # Delete the document
        db.collection("studentData").document(student_id).delete()
        
        return {"message": "Student deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete student: {str(e)}")
    
@app.get("/me")
def get_current_user(user=Depends(verify_token)):
    """
    Returns current authenticated admin info
    """
    return {
        "userName": user.get("name"),
        "profilePhoto": user.get("picture"),
        "userId": user.get("uid"),
        "email": user.get("email"),
    }

@app.post("/sendInactiveEmails")
def sendInactiveEmails(user=Depends(verify_token)):
    """Manual trigger for inactive student emails"""
    count_sent = checkInactiveStudents()

    # --- Update admin metrics: followUpsSent ---
    admin_id = user.get("uid")
    doc = db.collection("adminMetrics").document(admin_id).get()
    existing_metrics = doc.to_dict() if doc.exists else {}
    updated_metrics = {**existing_metrics, "followUpsSent": existing_metrics.get("followUpsSent",0)+count_sent}
    updated_metrics["score"] = calculate_admin_score(updated_metrics)
    updated_metrics["lastUpdated"] = datetime.utcnow()
    db.collection("adminMetrics").document(admin_id).set(updated_metrics)
    # --- End metrics update ---

    return {"message": "Inactive student emails sent"}

#Reminder end points
@app.get("/reminders")
def get_reminders(user=Depends(verify_token)):
    """Get all reminders (or filter by user if desired)"""
    reminders_ref = db.collection("reminders").stream()
    reminders = [doc.to_dict() | {"id": doc.id} for doc in reminders_ref]
    return {"reminders": reminders}

@app.post("/reminders")
def create_reminder(reminder: Reminder, user=Depends(verify_token)):
    """Create a new reminder"""
    reminder_dict = reminder.dict()
    reminder_dict["createdBy"] = user.get("uid")
    doc_ref = db.collection("reminders").add(reminder_dict)

    # --- Update admin metrics ---
    admin_id = user.get("uid")
    doc = db.collection("adminMetrics").document(admin_id).get()
    existing_metrics = doc.to_dict() if doc.exists else {}
    updated_metrics = {**existing_metrics, "remindersCreated": existing_metrics.get("remindersCreated",0)+1}
    updated_metrics["score"] = calculate_admin_score(updated_metrics)
    updated_metrics["lastUpdated"] = datetime.utcnow()
    db.collection("adminMetrics").document(admin_id).set(updated_metrics)
    # --- End metrics update ---

    return {"id": doc_ref[1].id, "message": "Reminder created"}

@app.put("/reminders/{reminder_id}")
def update_reminder(reminder_id: str, payload: dict, user=Depends(verify_token)):
    """
    Update reminder status or any other field
    payload example: {"status": "completed"}
    """
    doc_ref = db.collection("reminders").document(reminder_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Optional: you could check if the user is authorized to update this reminder
    
    doc_ref.update(payload)
    return {"message": "Reminder updated", "id": reminder_id, "updated_fields": payload}

#Admin Metrics end point
@app.get("/adminMetrics")
def get_admin_metrics(user=Depends(verify_token)):
    try:
        metrics_ref = db.collection("adminMetrics").stream()
        data = []
        for doc in metrics_ref:
            item = doc.to_dict() | {"id": doc.id}
            data.append(item)
        # Sort descending by score
        data.sort(key=lambda x: x.get("score", 0), reverse=True)
        return {"metrics": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")

@app.post("/adminMetrics/update")
def update_admin_metrics(payload: dict, user=Depends(verify_token)):
    try:
        admin_id = user.get("uid")
        doc_ref = db.collection("adminMetrics").document(admin_id)
        doc = doc_ref.get()
        existing = doc.to_dict() if doc.exists else {}

        # Merge existing metrics with new ones
        updated_metrics = {**existing, **payload}
        updated_metrics["score"] = calculate_admin_score(updated_metrics)
        updated_metrics["lastUpdated"] = datetime.utcnow()

        doc_ref.set(updated_metrics)
        return {"message": "Admin metrics updated successfully", "metrics": updated_metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update metrics: {str(e)}")
    
@app.get("/adminScore")
def get_admin_score(user=Depends(verify_token)):
    """
    Returns the score for the logged-in admin based on their metrics.
    Automatically initializes the adminMetrics document if it doesn't exist.
    """
    admin_uid = user.get("uid")
    doc_ref = db.collection("adminMetrics").document(admin_uid)
    doc = doc_ref.get()

    if not doc.exists:
        # Initialize metrics if document doesn't exist
        initial_metrics = {
            "activeContacts7Days": 0,
            "remindersCreated": 0,
            "profileUpdates": 0,
            "followUpsSent": 0,
            "score": 0,
            "lastUpdated": datetime.utcnow()
        }
        doc_ref.set(initial_metrics)
        return {"adminId": admin_uid, "score": 0}

    # If document exists, calculate score based on stored metrics
    metrics = doc.to_dict()
    score = calculate_admin_score(metrics)

    return {"adminId": admin_uid, "score": score}

#General Stats end point
@app.get("/generalStats")
def general_stats():
    try:
        students_ref = db.collection("studentData").stream()
        students = [doc.to_dict() for doc in students_ref]

        total_students = len(students)
        exploring = len([s for s in students if s.get("applicationStatus") == "exploring"])
        shortlisting = len([s for s in students if s.get("applicationStatus") == "shortlisting"])
        applying = len([s for s in students if s.get("applicationStatus") == "applying"])
        submitted = len([s for s in students if s.get("applicationStatus") == "submitted"])
        inactive7 = len([s for s in students if s.get("lastActive", 0) > 7])

        return {
            "totalStudents": total_students,
            "exploring": exploring,
            "shortlisting": shortlisting,
            "applying": applying,
            "submitted": submitted,
            "inactive7Days": inactive7
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch general stats: {str(e)}")

#Leaderboard end point
@app.get("/leaderboard")
def leaderboard():
    try:
        metrics_ref = db.collection("adminMetrics").stream()
        metrics = [doc.to_dict() for doc in metrics_ref]

        # Only keep userName and score
        leaderboard = [{"userName": m.get("userName", "Unknown"), "score": m.get("score", 0)} for m in metrics]

        # Sort by score descending
        leaderboard.sort(key=lambda x: x["score"], reverse=True)

        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")




