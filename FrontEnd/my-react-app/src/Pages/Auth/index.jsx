import { auth, provider } from "../../config/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import "./styles.css";

export const Auth = () => {
  const navigate = useNavigate()

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken(); // Firebase ID token

    const authInfo = {
        userName: result.user.displayName,
        profilePhoto: result.user.photoURL,
        userId: result.user.uid,
        isAuth: true,
        token,
    }

    //Use cookies for more security
    localStorage.setItem("auth", JSON.stringify(authInfo));
    
    navigate("/AdminDashboard")
  };

  return (
    <div className="login-page">
      <p>Welcome to Undergraduation's Admin Dahsboard</p>
      <img src="/undergraduation-logo.png" alt="Undergraduation.com Logo" className="logo" />
      <p>Sign In With Google to Continue</p>
      <button className="login-with-google-btn" onClick={signInWithGoogle} > Sign In With Google </button>
    </div>
  );


};
