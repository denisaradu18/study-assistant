import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxUTdmGqKTpMRsYCmNKbc3IN8X6B1I4TI",
  authDomain: "study-assistant-f15de.firebaseapp.com",
  projectId: "study-assistant-f15de",
  storageBucket: "study-assistant-f15de.firebasestorage.app",
  messagingSenderId: "784614595726",
  appId: "1:784614595726:web:0f3fe72ba6f6e956807ddf",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); 