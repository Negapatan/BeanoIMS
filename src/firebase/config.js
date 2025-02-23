import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqe1QBjasEWRJubOpp65YWVGTgIaD7R1Q",
  authDomain: "beano-coffee.firebaseapp.com",
  projectId: "beano-coffee",
  storageBucket: "beano-coffee.appspot.com",
  messagingSenderId: "908454829680",
  appId: "1:908454829680:web:81c38548e7457997af1eb5"
};

// Initialize Firebase before anything else
const app = initializeApp(firebaseConfig);

// Initialize services after Firebase is initialized
const auth = getAuth(app);
const db = getFirestore(app);

// Export initialized instances
export { auth, db }; 