import { useEffect, useState } from "react";
import { useAddStudentData } from "c:/VSCodeFolders/undergraduation-CRM/FrontEnd/my-react-app/src/hooks/useAddStudentData.js";
import { useGetStudentData } from "../../hooks/useGetStudentData";
import { useGetUserInfo } from "../../hooks/useGetUserInfo";
import { useUpdateStudentData } from "../../hooks/useUpdateStudentData";
import { useDeleteStudentData } from "../../hooks/useDeleteStudentData";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';

import axios from "axios";

import "./styles.css";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";

// Set the app element for accessibility
Modal.setAppElement('#root');

export const AdminDashboard = () => {

    const [studentDatas, setStudentDatas] = useState([]);
    const [name, setName] = useState("");
    const [applicationStatus, setApplicationStatus] = useState("exploring");
    const [lastActive, setLastActive] = useState(0);
    const [chatHistorySummary, setChatHistorySummary] = useState("");
    const navigate = useNavigate();

    const { userName, profilePhoto, userId, isAuth } = useGetUserInfo();

    const { addStudentData } = useAddStudentData();
    const { updateStudentData } = useUpdateStudentData();
    const { deleteStudentData } = useDeleteStudentData();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [countryFilter, setCountryFilter] = useState("");
    const [showNotContacted7Days, setShowNotContacted7Days] = useState(false);

    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderTitle, setReminderTitle] = useState("");
    const [reminderDescription, setReminderDescription] = useState("");
    const [reminderDueDate, setReminderDueDate] = useState("");

    const [adminScore, setAdminScore] = useState(null);

    // State for editing/adding a student
    const [editingStudent, setEditingStudent] = useState(null);

    // Fetch admin score from backend
    const fetchAdminScore = async () => {
        try {
            const token = JSON.parse(localStorage.getItem("auth"))?.token;
            const res = await axios.get("http://localhost:8000/adminScore", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminScore(res.data.score);
        } catch (err) {
            console.error("Failed to fetch admin score:", err);
        }
    };


    const createReminder = async () => {
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        await axios.post(
            "http://localhost:8000/reminders",
            {
            title: reminderTitle,
            description: reminderDescription,
            assignedTo: [userId],
            dueDate: reminderDueDate,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setShowReminderModal(false);
        alert("Reminder created!");

        fetchAdminScore(); // ✅ update the score
    };



    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (editingStudent.id) {
            const { id, ...updatedData } = editingStudent;
            await updateStudentData(id, updatedData, setStudentDatas);
        } else {
            await addStudentData(editingStudent, setStudentDatas);
        }

        setEditingStudent(null);

        fetchAdminScore(); // ✅ update the score
    };


    const API_URL = "http://localhost:8000/students"; //Fast Api backend

    // --- Fetch students belonging to this admin ---
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = JSON.parse(localStorage.getItem("auth"))?.token;
                if (!token) return;

                const res = await axios.get("http://localhost:8000/students", {
                headers: { Authorization: `Bearer ${token}` },
                });

                // Filter students by admin userId
                const myStudents = res.data.students.filter(s => s.userId === userId);
                setStudentDatas(myStudents);
            } catch (err) {
                console.error("Failed to fetch students:", err);
            }
        };

        if (isAuth) fetchStudents();
    }, [isAuth, userId]);

    useEffect(() => {
        if (isAuth) fetchAdminScore(); // fetch score on mount
    }, [isAuth]);


    // Sign User/ Admin out
    const signUserOut = async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            navigate("/");
        }
        catch (err) {
            console.error(err);
        }
    };

    // Automatic email sender for inactivity
    const sendInactiveEmails = async () => {
        try {
            const token = JSON.parse(localStorage.getItem("auth"))?.token;
            await axios.post("http://localhost:8000/sendInactiveEmails", {}, {
                headers: {Authorization: `Bearer ${token}` }
            });
            alert("Inactive Students emails sent!");
        } catch (err) {
            console.error("Failed to send emails:", err);
            alert("Failed to send emails");
        }
    }

    //Date parsing logic
    const isNotContacted7Days = (student) => {
    if (!student.communicationLog) return true; // treat as never contacted
    const entries = student.communicationLog.split(","); // split each log entry
    const dates = entries.map(entry => {
        const dateStr = entry.split(":")[0].trim(); // extract the date part
        const parts = dateStr.split("/"); // expected MM/DD/YYYY
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[0] - 1, parts[1]); // YYYY, MM index, DD
    }).filter(d => d); // remove invalid dates

    if (dates.length === 0) return true; // no valid dates

    const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
    };



    // Filter student data logic
    const filteredStudents = studentDatas.filter(student => {
    const term = searchTerm.toLowerCase();

    const inNameOrEmail =
        (student.name && student.name.toLowerCase().includes(term)) ||
        (student.email && student.email.toLowerCase().includes(term));

    const inNotes = student.notes && student.notes.toLowerCase().includes(term);
    const inCountry = student.country && student.country.toLowerCase().includes(term);
    const inChatSummary = student.chatHistorySummary && student.chatHistorySummary.toLowerCase().includes(term);

    const matchesSearch = !searchTerm || inNameOrEmail || inNotes || inChatSummary || inCountry;
    const matchesStatus = !statusFilter || student.applicationStatus === statusFilter;
    const matchesCountry = !countryFilter || student.country === countryFilter;
    console.log("Student:", student.country);

    const matchesQuickFilter = !showNotContacted7Days || isNotContacted7Days(student);

    return matchesSearch && matchesStatus && matchesCountry && matchesQuickFilter;
    });



    // Modal custom styles
    const modalStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
        }
    };

    return (
    
        <div className="adminDashboard"> 
            <div className="container">
                <h1>{userName}'s Admin Dashboard</h1>

                {profilePhoto && (
                <div className="profile">
                    <img className="profilePhoto" src={profilePhoto} />
                </div>
                )}

                <button className="signOutButton" onClick={signUserOut}>
                Sign Out
                </button>

                <button onClick={() => setEditingStudent({})}>Add Student</button>

                <button onClick={() => setShowReminderModal(true)}>Add Reminder</button>

                <Modal isOpen={showReminderModal} onRequestClose={() => setShowReminderModal(false)}>
                    <h3>Create Reminder</h3>
                    <input placeholder="Title" value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} />
                    <textarea placeholder="Description" value={reminderDescription} onChange={e => setReminderDescription(e.target.value)} />
                    <input type="datetime-local" value={reminderDueDate} onChange={e => setReminderDueDate(e.target.value)} />
                    <button onClick={createReminder}>Save</button>
                    <button onClick={() => setShowReminderModal(false)}>Cancel</button>
                </Modal>

                <button
                className="calendarButton"
                onClick={() => navigate("/calendar")}
                title="View Team Calendar"
                >
                View Calendar
                </button>

                <button
                className="calendarButton"
                onClick={() => navigate("/GeneralPage")}
                title="View General Page and Leaderboard"
                >
                View General Page
                </button>

            </div>

            <div className="admin-score">
                <h3>Your Current Score: {adminScore !== null ? adminScore : "Loading..."}</h3>
            </div>
            
            <div className="studentDatas">
                <h3>Student Data List</h3>
                <button onClick={sendInactiveEmails} className="btn btn-secondary">
                    Send Inactive Student Emails
                </button>

                <div className="student-directory">
                {/* Summary Statistics */}
                <div className="stats-bar">
                    <div className="stat-item">
                    <span className="stat-number">{studentDatas.length}</span>
                    <span className="stat-label">Total Students</span>
                    </div>
                    <div className="stat-item">
                    <span className="stat-number">
                        {studentDatas.filter(s => s.applicationStatus === 'exploring').length}
                    </span>
                    <span className="stat-label">Exploring</span>
                    </div>
                    <div className="stat-item">
                    <span className="stat-number">
                        {studentDatas.filter(s => s.applicationStatus === 'shortlisting').length}
                    </span>
                    <span className="stat-label">Shortlisting</span>
                    </div>
                    <div className="stat-item">
                    <span className="stat-number">
                        {studentDatas.filter(s => s.applicationStatus === 'applying').length}
                    </span>
                    <span className="stat-label">Applying</span>
                    </div>
                    <div className="stat-item">
                    <span className="stat-number">
                        {studentDatas.filter(s => s.applicationStatus === 'submitted').length}
                    </span>
                    <span className="stat-label">Submitted</span>
                    </div>
                    <div className="stat-item alert">
                    <span className="stat-number">
                        {studentDatas.filter(s => (s.lastActive || 0) > 7).length}
                    </span>
                    <span className="stat-label">Inactive 7+ Days</span>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="filters-bar">
                    <input
                    type="text"
                    placeholder="Search by name, email, notes, or AI chat summary..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    >
                    <option value="">All Statuses</option>
                    <option value="exploring">Exploring</option>
                    <option value="shortlisting">Shortlisting</option>
                    <option value="applying">Applying</option>
                    <option value="submitted">Submitted</option>
                    </select>
                    <select 
                    className="filter-select"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    >
                    <option value="">All Countries</option>
                    {[...new Set(studentDatas.map(s => s.country))].map(country => (
                        <option key={country} value={country}>{country}</option>
                    ))}
                    </select>
                    <button
                        className={`quickFilterButton  ${showNotContacted7Days ? "btn-danger" : "btn-view"}`}
                        onClick={() => setShowNotContacted7Days(prev => !prev)}
                    >
                        {showNotContacted7Days ? "Not Contacted 7+ Days" : "Show All Students"}
                    </button>

                </div>

                {/* Compact Table */}
                <div className="table-container">
                    <table className="student-table-compact">
                    <thead>
                        <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Country</th>
                        <th>Notes</th>
                        <th>Status</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((studentData) => {
                        const { id, name, country, email, notes, applicationStatus, lastActive } = studentData;
                        const getStatusClass = (status) => {
                            switch(status) {
                            case "exploring": return "status-exploring";
                            case "shortlisting": return "status-shortlisting";
                            case "applying": return "status-applying";
                            case "submitted": return "status-submitted";
                            default: return "status-default";
                            }
                        };

                        const formatLastActive = (days) => {
                            if (!days || days === 0) return "Today";
                            return `${days}d ago`;
                        };

                        return (
                            <tr key={id} className="student-row">
                            <td className="student-name">
                                <strong>{name}</strong>
                            </td>
                            <td className="student-email">{email}</td>
                            <td className="country">{country}</td>
                            <td>{notes}</td>
                            <td>
                                <span className={`status-badge ${getStatusClass(applicationStatus)}`}>
                                {applicationStatus}
                                </span>
                            </td>
                            <td>{formatLastActive(lastActive)}</td>
                            <td className="actions-compact">
                                <button 
                                className="btn-sm btn-view"
                                onClick={() => navigate(`/StudentInfo/${id}`)}
                                title="View Details"
                                >
                                View
                                </button>
                                <button 
                                className="btn-sm btn-edit"
                                onClick={() => setEditingStudent(studentData)}
                                title="Edit Student"
                                >
                                Edit
                                </button>
                                <button 
                                className="btn-sm btn-delete"
                                onClick={() => deleteStudentData(id, setStudentDatas)}
                                title="Delete Student"
                                >
                                Del
                                </button>
                            </td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                    
                    {studentDatas.length === 0 && (
                    <div className="no-students">
                        <p>No students found. Click "Add Student" to get started.</p>
                    </div>
                    )}
                </div>

                <div className="results-summary">
                    Showing {filteredStudents.length} of {studentDatas.length} students
                </div>
                </div>
            </div>

            {/* React Modal */}
            <Modal
                isOpen={!!editingStudent}
                onRequestClose={() => setEditingStudent(null)}
                style={modalStyles}
                contentLabel="Student Form Modal"
            >
                <div className="modal-header">
                    <h3>{editingStudent?.id ? `Update ${editingStudent.name}` : "Add Student"}</h3>
                </div>
                
                <form onSubmit={(e) => handleEditSubmit(e)} className="student-form">
                    <div className="form-row">
                        <input type="text" placeholder="Name" value={editingStudent?.name || ""} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                        <input type="email" placeholder="Email" value={editingStudent?.email || ""} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} />
                    </div>
                    
                    <div className="form-row">
                        <input type="text" placeholder="Documents Submitted" value={editingStudent?.documentsSubmitted || ""} onChange={(e) => setEditingStudent({ ...editingStudent, documentsSubmitted: e.target.value })} />
                        <input type="text" placeholder="Communication Log (mm/dd/yyyy:Chanel:Message)" value={editingStudent?.communicationLog || ""} onChange={(e) => setEditingStudent({ ...editingStudent, communicationLog: e.target.value })} />
                    </div>
                    
                    <div className="form-row">
                        <input type="text" placeholder="Login Activity" value={editingStudent?.loginActivity || ""} onChange={(e) => setEditingStudent({ ...editingStudent, loginActivity: e.target.value })} />
                        <input type="number" placeholder="Phone" value={editingStudent?.phone || ""} onChange={(e) => setEditingStudent({ ...editingStudent, phone: Number(e.target.value) })} />
                    </div>
                    
                    <div className="form-row">
                        <input type="text" placeholder="Country" value={editingStudent?.country || ""} onChange={(e) => setEditingStudent({ ...editingStudent, country: e.target.value })} />
                        <select value={editingStudent?.applicationStatus || "exploring"} onChange={(e) => setEditingStudent({ ...editingStudent, applicationStatus: e.target.value })}>
                            <option value="exploring">Exploring</option>
                            <option value="shortlisting">Shortlisting</option>
                            <option value="applying">Applying</option>
                            <option value="submitted">Submitted</option>
                        </select>
                    </div>
                    
                    <div className="form-row">
                        <input type="number" placeholder="Last Active" value={editingStudent?.lastActive || ""} onChange={(e) => setEditingStudent({ ...editingStudent, lastActive: Number(e.target.value) })} />
                        <input type="text" placeholder="AI Chat History Summary" value={editingStudent?.chatHistorySummary || ""} onChange={(e) => setEditingStudent({ ...editingStudent, chatHistorySummary: e.target.value })} />
                    </div>
                    
                    <div className="form-row">
                        <input type="text" placeholder="Colleges" value={editingStudent?.colleges || ""} onChange={(e) => setEditingStudent({ ...editingStudent, colleges: e.target.value })} />
                        <input type="text" placeholder="Preferred Major" value={editingStudent?.prefMajor || ""} onChange={(e) => setEditingStudent({ ...editingStudent, prefMajor: e.target.value })} />
                    </div>
                    
                    <div className="form-row">
                        <input type="text" placeholder="Preferred States" value={editingStudent?.prefStates || ""} onChange={(e) => setEditingStudent({ ...editingStudent, prefStates: e.target.value })} />
                        <input type="number" placeholder="Preferred Tuition Budget" value={editingStudent?.prefTuitionBudget || ""} onChange={(e) => setEditingStudent({ ...editingStudent, prefTuitionBudget: Number(e.target.value) })} />
                    </div>
                    
                    <div className="form-row">
                        <input type="number" placeholder="Preferred Class Size" value={editingStudent?.prefClassSize || ""} onChange={(e) => setEditingStudent({ ...editingStudent, prefClassSize: Number(e.target.value) })} />
                        <input type="text" placeholder="Test Scores" value={editingStudent?.testScores || ""} onChange={(e) => setEditingStudent({ ...editingStudent, testScores: e.target.value })} />
                    </div>
                    
                    <input type="text" placeholder="Essay Topics" value={editingStudent?.essayTopics || ""} onChange={(e) => setEditingStudent({ ...editingStudent, essayTopics: e.target.value })} className="full-width" />
                    
                    <input type="text" placeholder="Activities" value={editingStudent?.activities || ""} onChange={(e) => setEditingStudent({ ...editingStudent, activities: e.target.value })} className="full-width" />
                    
                    <input type="text" placeholder="Resume" value={editingStudent?.resume || ""} onChange={(e) => setEditingStudent({ ...editingStudent, resume: e.target.value })} className="full-width" />
                    
                    <input type="text" placeholder="Notes" value={editingStudent?.notes || ""} onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })} className="full-width" />
                    
                    <div className="button-row">
                        <button type="button" onClick={() => setEditingStudent(null)} className="btn-cancel">Cancel</button>
                        <button type="submit" className="btn-save">Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};