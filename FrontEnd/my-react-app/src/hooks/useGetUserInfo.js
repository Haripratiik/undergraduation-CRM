import { useState, useEffect } from "react";
import axios from "axios";

export const useGetUserInfo = () => {
  const [userInfo, setUserInfo] = useState({
    userName: "",
    profilePhoto: "",
    userId: "",
    email: "",
    isAuth: false,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get token from localStorage (saved after Google login)
        const authData = JSON.parse(localStorage.getItem("auth"));
        if (!authData?.token) {
          setUserInfo({ isAuth: false });
          return;
        }

        const token = authData.token;

        // Fetch user info from FastAPI
        const res = await axios.get("http://localhost:8000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserInfo({
          ...res.data,
          isAuth: true,
        });

      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setUserInfo({ isAuth: false });
      }
    };

    fetchUserInfo();
  }, []);

  return userInfo;
};
