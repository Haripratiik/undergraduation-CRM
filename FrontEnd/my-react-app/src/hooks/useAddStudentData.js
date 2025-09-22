import axios from "axios";

export const useAddStudentData = () => {
  const addStudentData = async (studentData, setStudentDatas) => {
    try {
      const authInfo = JSON.parse(localStorage.getItem("auth"));
      const token = authInfo?.token;

      // Build request payload with all required fields
      const payload = {
        name: studentData.name || "",
        email: studentData.email || "",
        country: studentData.country || "",
        loginActivity: studentData.loginActivity || "",
        communicationLog: studentData.communicationLog || "",
        documentsSubmitted: studentData.documentsSubmitted || "",
        phone: Number(studentData.phone) || 0,
        applicationStatus: studentData.applicationStatus || "exploring",
        lastActive: Number(studentData.lastActive) || 0,
        prefMajor: studentData.prefMajor || "",
        prefStates: studentData.prefStates || "",
        prefTuitionBudget: Number(studentData.prefTuitionBudget) || 0,
        prefClassSize: Number(studentData.prefClassSize) || 0,
        testScores: studentData.testScores || "",
        essayTopics: studentData.essayTopics || "",
        activities: studentData.activities || "",
        resume: studentData.resume || "",
        colleges: studentData.colleges || "",
        chatHistorySummary: studentData.chatHistorySummary || "",
        //notes: Array.isArray(studentData.notes) ? studentData.notes : [],
        notes: studentData.notes || "",
      };


      // Send POST request to backend
      const res = await axios.post("http://localhost:8000/students", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      if (setStudentDatas) {
        setStudentDatas(prev => [...prev, { ...payload, id: res.data.id }]);
      }

      return res.data;
    } catch (err) {
      console.error("Failed to add student:", err);
      throw err;
    }
  };

  return { addStudentData };
};
