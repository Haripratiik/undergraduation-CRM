import axios from "axios";

export const useDeleteStudentData = () => {
  const deleteStudentData = async (studentId, setStudentDatas) => {
    try {
      const authInfo = JSON.parse(localStorage.getItem("auth"));
      const token = authInfo?.token;

      // Send DELETE request to FastAPI
      await axios.delete(`http://localhost:8000/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from local state immediately
      if (setStudentDatas) {
        setStudentDatas(prev => prev.filter(student => student.id !== studentId));
      }

    } catch (err) {
      console.error("Failed to delete student:", err);
      throw err;
    }
  };

  return { deleteStudentData };
};
