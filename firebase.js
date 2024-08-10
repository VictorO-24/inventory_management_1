// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAE6QZlseG3_UVBzi6chZqG2tUY4tYx3ZM",
  authDomain: "inventory-management-e1b46.firebaseapp.com",
  projectId: "inventory-management-e1b46",
  storageBucket: "inventory-management-e1b46.appspot.com",
  messagingSenderId: "103079745752",
  appId: "1:103079745752:web:ffc2184483325f8952dfad",
  measurementId: "G-GWL4H45YZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}