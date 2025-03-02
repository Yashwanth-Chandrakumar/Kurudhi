"use client"

import { auth } from '@/firebase/config';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (firstName, lastName, dob, email, password) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
  
      await sendEmailVerification(user);
  
      return user;
    } catch (error) {
      throw error;
    }
  };
  

  const signin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const router = useRouter();
  // ...
  const logout = () => {
    signOut(auth);
    router.push('/signin');
  };
  
  return (
    <AuthContext.Provider value={{ user, signup, signin, googleSignIn, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);