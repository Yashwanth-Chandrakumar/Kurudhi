"use client";
import { useAuth } from "@/context/AuthContext";
import CryptoJS from "crypto-js";
import { getApp, getApps, initializeApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isDonor, setIsDonor] = useState(true); // Default to true to hide "Become a Donor"
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/signin");
    setShowLogoutConfirm(false);
    setShowProfileDropdown(false);
  };

  const handleAuthClick = async () => {
    if (!user) {
      router.push("/signin");
    }
  };

  // Check user role
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
              setUserRole(data.role);
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

  // Check donor status
  useEffect(() => {
    const checkIfDonor = async () => {
      if (!user || !user.email) {
        setIsDonor(true); // Default to true to hide "Become a Donor"
        return;
      }

      try {
        const q = query(collection(db, "donors"), where("Email", "==", user.email));
        const snapshot = await getDocs(q);
        setIsDonor(!snapshot.empty); // Hide if user exists in donors collection
      } catch (error) {
        console.error("Error checking donor status:", error);
        setIsDonor(true); // Default to true on error
      }
    };

    checkIfDonor();
  }, [user]);

  // Fetch profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.email) return;
      try {
        const q = query(collection(db, "donors"), where("Email", "==", user.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setProfilePicture(data.profile_picture);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePicture();
  }, [user]);

  return (
    <nav className="bg-gradient-to-r from-red-700 to-red-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              {/* Replace "/kk.png" with your logo image */}
              <img src="/kk.png" alt="Logo" className="h-36 w-auto" />
              <img src="/rot1.png" alt="Logo" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
              Home
            </Link>
            <Link href="/dashboard" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/dashboard" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
              Dashboard
            </Link>
            <Link href="/about" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/about" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
              About
            </Link>
            {/* {user && !isDonor && (
              <Link href="/newdonor" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/newdonor" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                Become a Donor
              </Link>
            )} */}
            <Link href="/needdonor" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/needdonor" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
              Require a Donor
            </Link>
            <Link href="/camp" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/camp" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
              Host a Camp
            </Link>
            {user && (
              <Link href="/myrequests" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/myrequests" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                My Requests
              </Link>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                  className="bg-white text-red-600 hover:bg-red-100 p-2 rounded-full flex items-center justify-center"
                >
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                    <Link
                      href="/profile"
                      className={`block px-4 py-2 text-sm transition-colors ${pathname === "/profile" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      Profile
                    </Link>
                    {userRole === 'admin' && (
                      <Link
                        href="/admin"
                        className={`block px-4 py-2 text-sm transition-colors ${pathname === "/admin" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Admin
                      </Link>
                    )}
                    {userRole === 'superadmin' && (
                      <>
                        <Link
                          href="/admin"
                          className={`block px-4 py-2 text-sm transition-colors ${pathname === "/admin" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Admin
                        </Link>
                        <Link
                          href="/superadmin"
                          className={`block px-4 py-2 text-sm transition-colors ${pathname === "/superadmin" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Superadmin
                        </Link>
                      </>
                    )}

                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium"
              >
                Login / Sign up
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-red-200 focus:outline-none">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                Home
              </Link>
              <Link href="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/dashboard" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                Dashboard
              </Link>
              <Link href="/about" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/about" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                About
              </Link>
              {/* {user && !isDonor && (
                <Link href="/newdonor" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/newdonor" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                  Become a Donor
                </Link>
              )} */}
              <Link href="/needdonor" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/needdonor" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                Require a Donor
              </Link>
              <Link href="/camp" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/camp" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                Host a Camp
              </Link>
              {user && (
                <Link href="/myrequests" className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === "/myrequests" ? "text-white font-semibold border-b-2 border-white" : "text-white hover:bg-red-700"}`}>
                  My Requests
                </Link>
              )}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown((prev) => !prev)}
                    className="w-full text-center bg-white text-red-600 hover:bg-red-100 p-2 rounded-full flex items-center justify-center"
                  >
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover inline"
                      />
                    ) : (
                      <User className="w-6 h-6 inline" />
                    )}
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-full bg-white border rounded shadow-lg z-50">
                      <Link
                        href="/profile"
                        className={`block px-3 py-2 text-base transition-colors ${pathname === "/profile" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Profile
                      </Link>
                      {userRole === 'admin' && (
                        <Link
                          href="/admin"
                          className={`block px-3 py-2 text-base transition-colors ${pathname === "/admin" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Admin
                        </Link>
                      )}
                      {userRole === 'superadmin' && (
                        <>
                          <Link
                            href="/admin"
                            className={`block px-3 py-2 text-base transition-colors ${pathname === "/admin" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            Admin
                          </Link>
                          <Link
                            href="/superadmin"
                            className={`block px-3 py-2 text-base transition-colors ${pathname === "/superadmin" ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            Superadmin
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full text-left block px-3 py-2 text-base text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAuthClick}
                  className="w-full text-center bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-base font-medium"
                >
                  Login / Sign up
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-6 relative z-10 w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-4">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
