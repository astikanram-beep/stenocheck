import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9fE7TFNj43bUkWXJT54cWAr15dfWuIqg",
  authDomain: "stenocheck-3582a.firebaseapp.com",
  projectId: "stenocheck-3582a",
  storageBucket: "stenocheck-3582a.firebasestorage.app",
  messagingSenderId: "971471105131",
  appId: "1:971471105131:web:f2a2834d5067278bb3552e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);