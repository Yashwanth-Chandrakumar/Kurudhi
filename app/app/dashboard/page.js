'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { Info } from 'lucide-react';

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

/* 
  OtpInput Component:
  Renders 6 individual input boxes for OTP entry.
  Auto-advances focus on digit entry and shifts focus on Backspace.
  The onChange callback returns the concatenated OTP.
*/
function OtpInput({ length = 6, onChange, inputClassName = "w-12 h-12 text-center border border-white rounded-lg bg-white text-red-700 shadow-md" }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  useEffect(() => {
    onChange(otp.join(''));
  }, [otp, onChange]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      const newOtp = [...otp];
      newOtp[index] = val.slice(-1);
      setOtp(newOtp);
      if (val && index < length - 1) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <div className="flex space-x-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={inputClassName}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          ref={(el) => inputsRef.current[index] = el}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [ongoingRequests, setOngoingRequests] = useState([]);
  const [donorRecord, setDonorRecord] = useState(null);

  // Fetch donor record based on user's email
  useEffect(() => {
    if (user && user.email) {
      const q = query(collection(db, 'donors'), where('Email', '==', user.email));
      getDocs(q)
        .then(snapshot => {
          if (!snapshot.empty) {
            setDonorRecord(snapshot.docs[0].data());
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  // Utility: Color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-200 text-red-800';
      case 'received':
        return 'bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Check donation completion and update status if needed
  const checkDonationCompletion = async (requestId) => {
    const donationsRef = collection(db, 'requests', requestId, 'donations');
    const verifiedQuery = query(
      donationsRef,
      where('donorOtpVerified', '==', true),
      where('requesterOtpVerified', '==', true)
    );
    const snapshot = await getDocs(verifiedQuery);
    const verifiedCount = snapshot.size;
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;
    const requestData = requestSnap.data();
    await updateDoc(requestRef, { UnitsDonated: verifiedCount });
    if (verifiedCount >= requestData.UnitsNeeded) {
      await updateDoc(requestRef, { Verified: "completed" });
      alert('Blood request has been completed.');
    }
  };

  // Listen for accepted requests (ongoingRequests)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('Verified', '==', 'accepted'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOngoingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // DonorRequestCard displays a single request with donation details
  function DonorRequestCard({ request, donorRecord }) {
    const [donation, setDonation] = useState(null);
    const [enteredOtp, setEnteredOtp] = useState('');

    // Check donor eligibility based on last donation date.
    const canDonate = () => {
      if (!donorRecord) return true;
      if (!donorRecord.lastDonated) return true;
      const last = new Date(donorRecord.lastDonated);
      const now = new Date();
      const diffDays = (now - last) / (1000 * 60 * 60 * 24);
      return diffDays >= 30;
    };

    useEffect(() => {
      const q = query(
        collection(db, 'requests', request.id, 'donations'),
        where('donorId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setDonation(null);
        } else {
          const docData = snapshot.docs[0].data();
          setDonation({ id: snapshot.docs[0].id, ...docData });
        }
      });
      return () => unsubscribe();
    }, [request.id, user.uid]);

    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleDonateClick = async () => {
      if (!canDonate()) {
        alert('You cannot donate within 30 days of your last donation.');
        return;
      }
      const donorOtp = generateOTP();
      const requesterOtp = generateOTP();
      try {
        await addDoc(collection(db, 'requests', request.id, 'donations'), {
          donorId: user.uid,
          donorOtp,
          requesterOtp,
          donorOtpVerified: false,
          requesterOtpVerified: false,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error initiating donation:', error);
      }
    };

    const handleVerifyRequesterOtp = async () => {
      if (!donation) return;
      if (enteredOtp === donation.requesterOtp) {
        try {
          const donationRef = doc(db, 'requests', request.id, 'donations', donation.id);
          await updateDoc(donationRef, { donorOtpVerified: true });
          alert('OTP verified successfully.');
          checkDonationCompletion(request.id);
          if (user.email) {
            const donorQuery = query(collection(db, 'donors'), where('Email', '==', user.email));
            const donorSnapshot = await getDocs(donorQuery);
            if (!donorSnapshot.empty) {
              const donorDocRef = doc(db, 'donors', donorSnapshot.docs[0].id);
              await updateDoc(donorDocRef, { lastDonated: new Date() });
            }
          }
        } catch (error) {
          console.error('Error verifying OTP:', error);
        }
      } else {
        alert('Incorrect OTP entered.');
      }
      setEnteredOtp('');
    };

    return (
      <div className="bg-white p-8 rounded-xl shadow-2xl mb-8 transition transform hover:scale-105">
        <h2 className="text-2xl font-bold text-red-700 mb-2">{request.PatientName}</h2>
        <p className="text-gray-700"><strong>Blood Group:</strong> {request.BloodGroup}</p>
        <p className="text-gray-700"><strong>Units Needed:</strong> {request.UnitsNeeded}</p>
        <p className="text-gray-700"><strong>Units Donated:</strong> {request.UnitsDonated || 0}</p>
        <p className="mt-4">
          <strong>Status:</strong>{' '}
          <span className={`${getStatusColor(request.Verified)} px-4 py-1 rounded-full text-sm`}>
            {request.Verified === 'received' ? 'Pending' : request.Verified}
          </span>
        </p>
        {donation ? (
          donation.donorOtpVerified ? (
            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded">
              <p className="text-green-800 font-bold text-center">Donation completed</p>
              <p className="text-green-800 text-center text-sm mt-1"><strong>Your OTP:</strong> {donation.donorOtp}</p>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-yellow-800 mb-3 text-center"><strong>Your OTP:</strong> {donation.donorOtp}</p>
              <OtpInput onChange={setEnteredOtp} />
              <Button
                onClick={handleVerifyRequesterOtp}
                className="mt-4 w-full bg-red-600 text-white py-3 rounded-full hover:bg-red-700 transition-colors"
              >
                Verify Requester's OTP
              </Button>
            </div>
          )
        ) : (
          donorRecord && donorRecord.BloodGroup === request.BloodGroup ? (
            <Button 
              onClick={handleDonateClick} 
              className="mt-6 w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors" 
              disabled={!canDonate()}
            >
              {canDonate() ? 'Donate Blood' : 'Cannot Donate (Wait 30 Days)'}
            </Button>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-500">Blood group mismatch. You cannot donate.</p>
          )
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50">
      <Navbar />
      <header className="bg-gradient-to-r from-red-600 to-red-900 text-white py-10 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">Donor Dashboard</h1>
          <p className="mt-4 text-xl">Manage your donations and view accepted requests</p>
        </div>
      </header>
      <main className="min-h-screen container mx-auto px-4 py-12">
        <section>
          <h2 className="text-3xl font-bold text-red-700 mb-6 text-center">Current Requests</h2>
          {ongoingRequests.length === 0 ? (
            <p className="text-center text-gray-600 text-xl">No accepted requests available.</p>
          ) : (
            ongoingRequests.map(request => (
              <DonorRequestCard key={request.id} request={request} donorRecord={donorRecord} />
            ))
          )}
        </section>
      </main>
      <footer className="bg-red-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Kurudhi Kodai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
