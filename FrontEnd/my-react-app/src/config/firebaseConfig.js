// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsLsczjei22_Mo7N-BzKTCp6gLQF6rqE4",
  authDomain: "undergraduationcrm.firebaseapp.com",
  projectId: "undergraduationcrm",
  storageBucket: "undergraduationcrm.firebasestorage.app",
  messagingSenderId: "380756888301",
  appId: "1:380756888301:web:01cae856dcfb8a642c1ae4",
  measurementId: "G-9RKZQMH74G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// firebase login
// firebase init
// firebase deploy