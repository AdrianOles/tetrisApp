import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9HAqXlF4apoeXJXIbmeAqFp9Rd62iAm4",
  authDomain: "tetris-lamp.firebaseapp.com",
  projectId: "tetris-lamp",
  storageBucket: "tetris-lamp.firebasestorage.app",
  messagingSenderId: "1065335206324",
  appId: "1:1065335206324:web:34405e803970484e4402e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);




