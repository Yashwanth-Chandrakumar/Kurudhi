// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1n55zOb5xCWp3jS1mPRTwGWYx90rAzWE",
  authDomain: "kurudhi-3aec8.firebaseapp.com",
  projectId: "kurudhi-3aec8",
  storageBucket: "kurudhi-3aec8.appspot.com",
  messagingSenderId: "1056661616666",
  appId: "1:1056661616666:web:6b6b6b6b6b6b6b6b6b6b6b",
  measurementId: "G-GG6G6G6G6G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
