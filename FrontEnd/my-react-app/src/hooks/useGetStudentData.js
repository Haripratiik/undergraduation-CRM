import { useState, useEffect } from "react";
import axios from "axios";

export const useGetStudentData = () => {
  const [studentDatas, setStudentDatas] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const authInfo = JSON.parse(localStorage.getItem("auth"));
        const token = authInfo?.token;

        const res = await axios.get("http://localhost:8000/students", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudentDatas(res.data.students);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      }
    };

    fetchStudents();
  }, []);

  return { studentDatas, setStudentDatas };
};
