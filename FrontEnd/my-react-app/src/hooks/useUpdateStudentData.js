import axios from "axios";

export const useUpdateStudentData = () => {
  const updateStudentData = async (studentId, updatedData, setStudentDatas) => {
    try {
      const authInfo = JSON.parse(localStorage.getItem("auth"));
      const token = authInfo?.token;

      // Send PUT request to FastAPI
      await axios.put(`http://localhost:8000/students/${studentId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state immediately
      if (setStudentDatas) {
        setStudentDatas(prev =>
          prev.map(student =>
            student.id === studentId ? { ...student, ...updatedData } : student
          )
        );
      }

    } catch (err) {
      console.error("Failed to update student:", err);
      throw err;
    }
  };

  return { updateStudentData };
};
