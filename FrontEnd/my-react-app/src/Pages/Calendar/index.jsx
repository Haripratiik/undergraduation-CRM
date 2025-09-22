import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { parseISO, format, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";


import "./styles.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek,
  getDay,
  locales,
});

export const ReminderCalendar = () => {
  const navigate = useNavigate();

  const [reminders, setReminders] = useState([]);
  const [expandedReminderId, setExpandedReminderId] = useState(null);

  const toggleDetails = (id) =>
    setExpandedReminderId(expandedReminderId === id ? null : id);

  const fetchReminders = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      const res = await axios.get("http://localhost:8000/reminders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders(res.data.reminders);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const toggleStatus = async (reminderId, currentStatus) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      await axios.put(
        `http://localhost:8000/reminders/${reminderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReminders();
    } catch (err) {
      console.error("Failed to toggle reminder status:", err);
    }
  };

  const events = reminders.map((r) => ({
    id: r.id,
    title: r.title,
    start: new Date(r.dueDate),
    end: new Date(r.dueDate),
    allDay: false,
    description: r.description,
    status: r.status,
  }));

  const EventComponent = ({ event }) => {
    const isExpanded = expandedReminderId === event.id;

    return (
      <div
        className={`event-item ${event.status}`}
        style={{
          backgroundColor: event.status === "completed" ? "#d3ffd3" : "#ffe6e6",
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "6px",
          marginBottom: "4px",
        }}
      >
        <strong>{event.title}</strong>

        {isExpanded && (
          <div
            className="event-details"
            style={{
              marginTop: "6px",
              maxHeight: "200px", // constrain height for scrolling
              overflowY: "auto",
              padding: "4px",
              borderTop: "1px solid #ccc",
            }}
          >
            <div className="event-description" style={{ marginBottom: "6px" }}>
              {event.description}
            </div>
            <div className="event-time" style={{ fontSize: "12px", marginBottom: "6px" }}>
              {event.start.toLocaleString()}
            </div>
            <button
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: event.status === "completed" ? "#ffcccc" : "#ccffcc",
              }}
              onClick={() => toggleStatus(event.id, event.status)}
            >
              {event.status === "completed" ? "Mark as Pending" : "Mark Complete"}
            </button>
          </div>
        )}

        <button
          className="event-toggle-btn"
          style={{
            marginTop: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
          onClick={() => toggleDetails(event.id)}
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
      </div>
    );
  };

  return (
    <div className="reminder-calendar-container" style={{ height: "80vh", margin: "20px" }}>
      <h2>Team Reminders Calendar</h2>
      <button 
        className="calendarButton" 
        onClick={() => navigate("/AdminDashboard")}
      >
        Back to Dashboard
      </button>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%", overflowY: "auto" }}
        components={{ event: EventComponent }}
      />
    </div>
  );
};
