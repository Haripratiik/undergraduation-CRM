import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from './Modal';
import "./styles.css"

export const StudentInfo = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [visibleModal, setVisibleModal] = useState(null);

  const parseStringList = (dataString) => {
    if (!dataString) return [];
    return dataString.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        
        const res = await axios.get(`http://localhost:8000/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const parsedData = {
          ...res.data,
          communicationLog: parseStringList(res.data.communicationLog),
          documentsSubmitted: parseStringList(res.data.documentsSubmitted),
          loginActivity: parseStringList(res.data.loginActivity),
          notes: parseStringList(res.data.notes),
          resume: parseStringList(res.data.resume),
          chatHistorySummary: parseStringList(res.data.chatHistorySummary),
          testScores: parseStringList(res.data.testScores),
          activities: parseStringList(res.data.activities),
        };

        setStudentData(parsedData);
      } catch (err) {
        console.error("Failed to fetch student data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  if (isLoading) {
    return <div>Loading student data...</div>;
  }

  if (!studentData) {
    return <div>No student found with this ID.</div>;
  }
  
  const getModalContent = () => {
    switch (visibleModal) {
      case 'personal':
        return (
          <div>
            <h3>{studentData.name}'s Personal Information</h3>
            <ul>
              <li>Email: {studentData.email}</li>
              <li>Country: {studentData.country}</li>
              <li>Phone: {studentData.phone}</li>
              <li>Last Active: {studentData.lastActive} days ago</li>
              <li>Documents Submitted: 
                <ul>
                  {studentData.documentsSubmitted.length > 0 ? (
                    studentData.documentsSubmitted.map((item, index) => <li key={index}>{item}</li>)
                  ) : (
                    <li>N/A</li>
                  )}
                </ul>
              </li>
            </ul>
          </div>
        );
      case 'application':
        return (
          <div>
            <h3>{studentData.name}'s Application</h3>
            <ul>
              <li>Application Status: {studentData.applicationStatus}</li>
              <li>Colleges: {studentData.colleges}</li>
              <li>Preferred Major: {studentData.prefMajor}</li>
              <li>Test Scores:
                <ul>
                  {studentData.testScores.length > 0 ? (
                    studentData.testScores.map((item, index) => <li key={index}>{item}</li>)
                  ) : (
                    <li>N/A</li>
                  )}
                </ul>
              </li>
              <li>Essay Topics: {studentData.essayTopics}</li>
            </ul>
          </div>
        );
      case 'activities':
        return (
          <div>
            <h3>{studentData.name}'s Activities</h3>
            <ul>
              {studentData.activities.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        );
      case 'login':
        return (
          <div className="login-activity-scroll">
            <h3>{studentData.name}'s Login Activity</h3>
            <ul>
              {studentData.loginActivity.map((item, index) => <li key={index}>{item}</li>)}
            </ul>

            <h3>Communication Log</h3>
            <ul>
              {studentData.communicationLog.map((item, index) => <li key={index}>{item}</li>)}
            </ul>

            <h3>Chat History Summary</h3>
            <ul>
              {studentData.chatHistorySummary.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        );
      case 'preferences':
        return (
          <div>
            <h3>{studentData.name}'s Preferences</h3>
            <ul>
              <li>Preferred Major: {studentData.prefMajor}</li>
              <li>Preferred States: {studentData.prefStates}</li>
              <li>Preferred Tuition Budget: {studentData.prefTuitionBudget}</li>
              <li>Preferred Class Size: {studentData.prefClassSize}</li>
            </ul>
          </div>
        );
      case 'notes':
        return (
          <div>
            <h3>Notes on {studentData.name}</h3>
            <ul>
              {studentData.notes.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        );
      case 'resume':
        return (
          <div>
            <h3>{studentData.name}'s Resume</h3>
            <ul>
              {studentData.resume.length > 0 ? (
                studentData.resume.map((item, index) => <li key={index}>{item}</li>)
              ) : (
                <li>No resume available.</li>
              )}
            </ul>
          </div>
        );
      case 'aiSummary':
        return (
          <div>
            <h3>{studentData.name}'s AI Summary</h3>
            <p>
              The AI summary can be displayed here. 
              It can include information on their application progress, where they need help and more.
              The AI can take data from all the other data sets and make inferences on what the student could need, and provide a timeline of sorts.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="student-details-page">
      <h1>Student Details: {studentData.name}</h1>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${["exploring", "shortlisting", "applying", "submitted"].indexOf(
                studentData.applicationStatus?.toLowerCase()
              ) * 33 + 25}%`
            }}
          ></div>
        </div>
        <div className="progress-steps">
          <span className={studentData.applicationStatus?.toLowerCase() === "exploring" ? "active" : ""}>Exploring</span>
          <span className={studentData.applicationStatus?.toLowerCase() === "shortlisting" ? "active" : ""}>Shortlisting</span>
          <span className={studentData.applicationStatus?.toLowerCase() === "applying" ? "active" : ""}>Applying</span>
          <span className={studentData.applicationStatus?.toLowerCase() === "submitted" ? "active" : ""}>Submitted</span>
        </div>
      </div>

      
      <div className="button-group">
        <button onClick={() => setVisibleModal('personal')}>Personal Information</button>
        <button onClick={() => setVisibleModal('application')}>Application Information</button>
        <button onClick={() => setVisibleModal('activities')}>Activities</button>
        <button onClick={() => setVisibleModal('login')}>Login/Application Activity</button>
        <button onClick={() => setVisibleModal('preferences')}>Preferences</button>
        <button onClick={() => setVisibleModal('notes')}>Notes</button>
        <button onClick={() => setVisibleModal('resume')}>Resume</button>
        <button 
            onClick={() => setVisibleModal('aiSummary')} 
            className="ai-summary"
        >
            AI Summary
        </button>

      </div>

      <button
        className="back"
        onClick={() => navigate(`/AdminDashboard`)}
        title="Back to Admin Dashboard"
      >
        Back
      </button>

      <Modal show={!!visibleModal} onClose={() => setVisibleModal(null)}>
        {getModalContent()}
      </Modal> 
    </div>
  );
};