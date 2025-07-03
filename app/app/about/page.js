"use client"
import React, { useEffect, useState } from 'react';
import { Heart, Users, Target, Award, CheckCircle, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs,getCountFromServer } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';

// Firebase configuration
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

const TeamMember = ({ name, role, image }) => (
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
    <img src={image} alt={name} className="w-full h-56 object-cover" />
    <div className="p-6">
      <h3 className="text-2xl font-bold text-red-700">{name}</h3>
      <p className="text-lg text-gray-600">{role}</p>
    </div>
  </div>
);

const ValueCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
    <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mb-6">
      <Icon className="w-8 h-8 text-red-700" />
    </div>
    <h3 className="text-2xl font-bold mb-4 text-red-800">{title}</h3>
    <p className="text-gray-700 text-lg leading-relaxed">{description}</p>
  </div>
);

const StatCard = ({ value, label, icon: Icon }) => (
  <div className="bg-red-100 p-8 rounded-2xl shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
    <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
      <Icon className="w-10 h-10 text-red-600" />
    </div>
    <h3 className="text-5xl font-bold text-red-700 mb-2">{value}</h3>
    <p className="text-xl text-gray-700">{label}</p>
  </div>
);

export default function About() {
  const router = useRouter();
  const { user } = useAuth();
  const [isDonor, setIsDonor] = useState(false);
  const [stats, setStats] = useState({ donors: 0, requests: 0, unitsDonated: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const donorsCol = collection(db, 'donors');
        const requestsCol = collection(db, 'requests');

        const donorSnapshot = await getCountFromServer(donorsCol);
        const requestSnapshot = await getDocs(requestsCol);

        const totalDonors = donorSnapshot.data().count;
        const totalRequests = requestSnapshot.size;

        let totalUnitsDonated = 0;
        requestSnapshot.forEach(doc => {
          if (doc.data().UnitsDonated) {
            totalUnitsDonated += parseInt(doc.data().UnitsDonated, 10);
          }
        });

        setStats({
          donors: totalDonors,
          requests: totalRequests,
          unitsDonated: totalUnitsDonated,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-800 to-red-600 text-white py-20">
        <div className="absolute inset-0">
          <img 
            src="/api/placeholder/1600/900" 
            alt="About Us Background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-red-900 opacity-70"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-slide-in">
            About Kurudhi Kodai
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 animate-fade-in">
            Empowering communities through blood donation since 2023.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard 
              value={`${stats.donors}+`}
              label="Donors Registered"
              icon={Users} 
            />
            <StatCard 
              value={`${stats.requests}+`}
              label="Blood Requests Fulfilled"
              icon={Heart}
            />
            <StatCard 
              value={`${stats.unitsDonated}+`}
              label="Units Donated"
              icon={CheckCircle}
            />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex items-center justify-center md:w-1/2">
            <img 
              src="/freepik__adjust__67319.png" 
              alt="Our Mission" 
              className="rounded-2xl shadow-2xl animate-float max-h-96"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-6 text-red-800">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              At Kurudhi Kodai, we believe every life matters. Our mission is to bridge the gap between donors and recipients,
              ensuring safe and timely blood transfusions for all.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Since 2023, we have built a community of passionate donors and healthcare partners to keep our communities thriving.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-red-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-red-800 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <ValueCard 
              icon={Heart}
              title="Compassion"
              description="We believe in the power of kindness—helping one another to save lives."
            />
            <ValueCard 
              icon={Target}
              title="Excellence"
              description="Striving for perfection in every service, ensuring safety and efficiency."
            />
            <ValueCard 
              icon={Users}
              title="Community"
              description="Building a robust network of donors and healthcare professionals for a better tomorrow."
            />
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      

      {/* Team Section */}
      <section className="py-20 bg-red-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-red-800 mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <TeamMember 
              name="Dr. Sarah Johnson"
              role="Medical Director"
              image="/api/placeholder/400/300"
            />
            <TeamMember 
              name="John Smith"
              role="Operations Manager"
              image="/api/placeholder/400/300"
            />
            <TeamMember 
              name="Maria Garcia"
              role="Community Coordinator"
              image="/api/placeholder/400/300"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Be a hero in your community. Donate blood, save lives, and inspire change with Kurudhi Kodai.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isDonor ? (
              <button className="bg-white text-red-700 px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-all" onClick={() => router.push("/dashboard")}>
                Donate Now
              </button>
            ) : (
              <button className="bg-white text-red-700 px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-all" onClick={() => router.push("/newdonor")}>
                Become a Donor
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Kurudhi Kodai</h3>
              <p className="text-gray-400">Connecting communities with life-saving blood donations since 2023.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="/donate" className="text-gray-400 hover:text-white transition-colors">Donate Blood</a></li>
                <li><a href="/find" className="text-gray-400 hover:text-white transition-colors">Find Donors</a></li>
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
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Kurudhi Kodai. All rights reserved.</p>
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
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
