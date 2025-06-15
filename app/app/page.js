"use client";
import Navbar from "@/components/Navbar";
import { Activity, ArrowRight, Calendar, Heart, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";

import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, onSnapshot, query, where } from 'firebase/firestore';

// Firebase configuration (using your environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const StatCard = ({ icon: Icon, title, value }) => (
  <div className="bg-white bg-opacity-80 p-8 rounded-2xl shadow-xl transform hover:-translate-y-2 transition-all duration-300">
    <div className="flex items-center justify-center w-16 h-16 bg-red-200 rounded-full mx-auto mb-4">
      <Icon className="text-red-700 w-8 h-8" />
    </div>
    <h3 className="text-3xl font-extrabold text-red-900 text-center mb-2">{value}</h3>
    <p className="text-lg text-red-700 text-center font-semibold">{title}</p>
  </div>
);

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isDonor, setIsDonor] = useState(false);

  // State for real-time stats
  const [stats, setStats] = useState({
    activeDonors: 0,
    livesSaved: 0,
    successfulDonations: 0,
    bloodCamps: 0,
  });

  useEffect(() => {
    // Listen for active donors
    const donorsUnsub = onSnapshot(collection(db, 'donors'), (snapshot) => {
      setStats((prev) => ({ ...prev, activeDonors: snapshot.size }));
    });

    // Listen for requests to compute completed requests and sum of units donated
    const requestsUnsub = onSnapshot(collection(db, 'requests'), (snapshot) => {
      let completedCount = 0;
      let totalUnitsDonated = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.Verified === 'completed') {
          completedCount++;
          totalUnitsDonated += Number(data.UnitsDonated || 0);
        }
      });
      setStats((prev) => ({
        ...prev,
        livesSaved: completedCount,
        successfulDonations: totalUnitsDonated,
      }));
    });

    // Listen for blood camps
    const campsUnsub = onSnapshot(collection(db, 'camps'), (snapshot) => {
      setStats((prev) => ({ ...prev, bloodCamps: snapshot.size }));
    });

    // Cleanup listeners on unmount
    return () => {
      donorsUnsub();
      requestsUnsub();
      campsUnsub();
    };
  }, []);

  useEffect(() => {
    const checkIfDonor = async () => {
      if (user && user.email) {
        try {
          const q = query(collection(db, "donors"), where("Email", "==", user.email));
          const snapshot = await getDocs(q);
          setIsDonor(!snapshot.empty);
        } catch (error) {
          console.error("Error checking donor status:", error);
          setIsDonor(false);
        }
      } else {
        setIsDonor(false);
      }
    };

    checkIfDonor();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center bg-red-800 h-screen">
          <div className="absolute inset-0">
            {/* Background image can be enabled if desired */}
            {/* <img 
              src="/4414663.jpg"
              alt="Blood Donation" 
              className="w-full h-full object-cover opacity-30"
            /> */}
            <div className="absolute inset-0 bg-red-900 opacity-60"></div>
          </div>
          <div className="relative z-10 container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-in">
                Every Drop <br /> of Blood <span className="text-red-300">Counts</span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8">
                Join our mission to save lives with every donation. Together, we make a difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="bg-white text-red-800 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all flex items-center" onClick={() => router.push('/dashboard')}>
                  Donate Now <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-red-800 transition-all" onClick={() => router.push('/needdonor')}>
                  Find Donors
                </button>
              </div>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
              <div className="w-full max-w-md px-4">
                <img 
                  src="/4414663.jpg"
                  alt="Blood Donation" 
                  className="w-full h-[400px] object-cover rounded-2xl border-4 border-white shadow-2xl animate-float"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard icon={Users} title="Active Donors" value={stats.activeDonors} />
              <StatCard icon={Heart} title="Lives Saved" value={stats.livesSaved} />
              <StatCard icon={Activity} title="Successful Donations" value={stats.successfulDonations} />
              <StatCard icon={Calendar} title="Blood Drives" value={stats.bloodCamps} />
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-red-900 mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Register",
                  description: "Sign up and provide your essential medical info."
                },
                {
                  step: "2",
                  title: "Request/Find",
                  description: "Search for donors or post a blood request effortlessly."
                },
                {
                  step: "3",
                  title: "Connect",
                  description: "Communicate and schedule your donation seamlessly."
                }
              ].map((item, index) => (
                <div key={index} className="p-8 rounded-2xl bg-red-50 shadow-lg hover:shadow-2xl transition-shadow text-center">
                  <div className="w-16 h-16 bg-red-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-red-900 mb-4">{item.title}</h3>
                  <p className="text-red-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isDonor && (
          <section className="bg-red-700 text-white py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold mb-6">Ready to Save Lives?</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Become a part of our dedicated community of blood donors and make a life-changing impact today.
              </p>
              <button className="bg-white text-red-700 px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-all" onClick={() => router.push('/newdonor')}>
                Register as Donor
              </button>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-red-900 mb-12">Get in Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <Phone className="w-8 h-8 text-red-700 mb-2" />
                <span className="text-red-800 font-semibold">+1 (123) 456-7890</span>
              </div>
              <div className="flex flex-col items-center">
                <Mail className="w-8 h-8 text-red-700 mb-2" />
                <span className="text-red-800 font-semibold">contact@kurudhikodai.com</span>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="w-8 h-8 text-red-700 mb-2" />
                <span className="text-red-800 font-semibold">Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Kurudhi Kodai</h3>
              <p className="text-gray-400">
                Connecting blood donors with those in need since 2024.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Donate Blood</a></li>
                <li><a href="/needdonor" className="text-gray-400 hover:text-white transition-colors">Find Donors</a></li>
              </ul> 
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQs</a></li>
                <li><a href="/guidelines" className="text-gray-400 hover:text-white transition-colors">Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Kurudhi Kodai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
