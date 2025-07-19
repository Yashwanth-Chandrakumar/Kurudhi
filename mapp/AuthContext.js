import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; // Assuming db is exported from firebase.js
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

// Custom hook for accessing the auth context easily across the app
export const useAuth = () => {
  return React.useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (firstName, lastName, dob, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user);

    // Save additional user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      dob,
      email,
      uid: user.uid
    });

    return userCredential;
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
