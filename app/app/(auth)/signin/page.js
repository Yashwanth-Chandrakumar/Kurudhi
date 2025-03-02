'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CryptoJS from "crypto-js";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const SECRET_KEY = process.env.NEXT_PUBLIC_UUID_SECRET || "default_secret_key";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const { signin, googleSignIn } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Encrypt and store the user's UID in localStorage
  const storeEncryptedUUID = (uid) => {
    const encryptedUID = CryptoJS.AES.encrypt(uid, SECRET_KEY).toString();
    localStorage.setItem("userUUID", encryptedUID);
  };

  // Check whether the user document exists in "users" collection; if not, add it with a default role of "user"
  const checkAndAddUser = async (userCredential) => {
    const uid = userCredential.uid;
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid,
        email: userCredential.email,
        role: "user",
      });
    }
  };

  // After signin, check if donor record exists using the user's email.
  const checkDonorRecord = async (email) => {
    const donorQuery = query(collection(db, "donors"), where("Email", "==", email));
    const donorSnapshot = await getDocs(donorQuery);
    return !donorSnapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Sign in using email and password
      const userCredential = await signin(formData.email, formData.password);
      const uid = userCredential.uid;
      storeEncryptedUUID(uid);
      await checkAndAddUser(userCredential);
      // Check donor record by email; if not present, redirect to newdonor page.
      const isDonor = await checkDonorRecord(formData.email);
      if (!isDonor) {
        router.push("/newdonor");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await googleSignIn();
      const uid = userCredential.uid;
      storeEncryptedUUID(uid);
      await checkAndAddUser(userCredential);
      // Check donor record by email
      const isDonor = await checkDonorRecord(userCredential.email);
      if (!isDonor) {
        router.push("/newdonor");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const navigateToSignUp = () => {
    router.push("/signup");
  };

  return (
    <>
      {/* <Navbar /> */}
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-md">
          <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
            Blood Donation Platform
          </h1>
          
          <Card className="border-2 border-red-100 shadow-lg">
            <CardContent className="pt-8">
              <p className="text-center text-gray-600 mb-6">
                Sign in to continue
              </p>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-red-700">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    onChange={handleChange}
                    className="border-red-200 focus:ring-red-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label className="text-red-700">Password</Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    required
                    onChange={handleChange}
                    className="border-red-200 focus:ring-red-500"
                    placeholder="Enter your password"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Sign In
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <a href="/forgot-password" className="text-sm text-red-500 hover:underline">
                  Forgot Password?
                </a>
              </div>
              
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full flex items-center justify-center border-2 border-red-200 hover:bg-red-50 text-gray-700"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.4 7.7 2.7l5.7-5.7C33.4 3.5 29.1 1 24 1 14.8 1 6.9 6.3 2.8 14.3l6.6 5.1C10.9 13.3 16.7 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.6c0-1.5-.1-2.6-.3-3.8H24v7.2h12.5c-.5 3-2.2 6.1-5.2 8l6.7 5.2c3.9-3.6 6.1-8.9 6.1-16.6z" />
                  <path fill="#FBBC05" d="M10.9 28.1c-.6-1.7-1-3.5-1-5.3s.4-3.6 1-5.3L4.3 12.4C2.4 15.4 1.7 18.8 1.7 22.1c0 3.3.7 6.7 2.6 9.7l6.6-5.2z" />
                  <path fill="#34A853" d="M24 47c6.5 0 11.9-2.1 15.8-5.7l-6.7-5.2c-3.1 2.1-7.1 3.4-9.1 3.4-6.9 0-12.7-4.7-14.8-11l-6.6 5.2C6.9 41.7 14.8 47 24 47z" />
                  <path fill="none" d="M1 1h46v46H1z" />
                </svg>
                Sign in with Google
              </Button>
              
              <div className="mt-6 text-center">
                <Button
                  onClick={navigateToSignUp}
                  variant="link"
                  className="text-sm text-red-500 hover:underline"
                >
                  New user - Register here
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}