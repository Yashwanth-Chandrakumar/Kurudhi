

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth,initializeAuth,getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyD1n55zOb5xCWp3jS1mPRTwGWYx90rAzWE",
    authDomain: "kurudhi-3aec8.firebaseapp.com",
    projectId: "kurudhi-3aec8",
    storageBucket: "kurudhi-3aec8.firebasestorage.app",
    messagingSenderId: "936520747934",
    appId: "1:936520747934:web:c17cc5b4aa7ce54ca2248f",
    measurementId: "G-N7JGJTRDE7"
  };

  const app = initializeApp(firebaseConfig);
  initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  const auth = getAuth(app);
  const db = getFirestore(app); 
  
  export { auth, db };