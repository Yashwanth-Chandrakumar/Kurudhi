"use client";
import { useAuth } from "@/context/AuthContext";
import CryptoJS from "crypto-js";
import { getApp, getApps, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Firebase configuration (ensure these match your project settings)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleAuthClick = async () => {
    if (user) {
      await logout();
    } else {
      router.push("/signin");
    }
  };

  // On component mount, decrypt the stored UID and check Firestore "users" collection for the user's role
  useEffect(() => {
    const checkUserRole = async () => {
      const encryptedUID = localStorage.getItem("userUUID");
      if (encryptedUID) {
        const secretKey = process.env.NEXT_PUBLIC_UUID_SECRET || "default_secret_key";
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedUID, secretKey);
          const decryptedUID = bytes.toString(CryptoJS.enc.Utf8);
          if (decryptedUID) {
            const userDocRef = doc(db, "users", decryptedUID);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              setUserRole(data.role); // Expected to be "admin", "superadmin", or "user"
            } else {
              setUserRole(null);
            }
          }
        } catch (error) {
          console.error("Error decrypting UID or fetching user data:", error);
        }
      }
    };

    checkUserRole();
  }, []);

  return (
    <nav className="bg-red-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-white text-xl font-bold">Kurudhi Kodai</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Home
            </Link>
            <Link href="/dashboard" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
            <Link href="/about" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              About
            </Link>
            <Link href="/newdonor" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Become a Donor
            </Link>
            <Link href="/needdonor" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Require a Donor
            </Link>
            <Link href="/camp" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Host a Camp
            </Link>
            {/* Conditionally render the role-based option */}
            {userRole === "admin" && (
              <Link href="/admin" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
                View as Admin
              </Link>
            )}
            {userRole === "superadmin" && (
              <Link href="/superadmin" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
                View as Super Admin
              </Link>
            )}
            <button
              onClick={handleAuthClick}
              className="bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium"
            >
              {user ? "Logout" : "Login / Sign up"}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-red-200 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Home
              </Link>
              <Link href="/dashboard" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
              <Link href="/about" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                About
              </Link>
              <Link href="/newdonor" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Become a Donor
              </Link>
              <Link href="/needdonor" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Require a Donor
              </Link>
              <Link href="/camp" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Host a Camp
            </Link>
              {/* Conditionally render role-based option for mobile */}
              {userRole === "admin" && (
                <Link href="/admin" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                  View as Admin
                </Link>
              )}
              {userRole === "superadmin" && (
                <Link href="/superadmin" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                  View as Super Admin
                </Link>
              )}
              <button
                onClick={handleAuthClick}
                className="w-full text-center bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-base font-medium"
              >
                {user ? "Logout" : "Login / Sign up"}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
