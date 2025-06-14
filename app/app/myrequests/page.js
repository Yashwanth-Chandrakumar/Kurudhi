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
  updateDoc,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';


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
  Renders 6 individual input boxes for OTP digits.
  Auto-advances focus on digit entry and shifts back on Backspace.
  onChange returns the concatenated OTP string.
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

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('accepted');

  // Listen for current user's requests
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('uuid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // RequesterRequestCard displays each request card
  function RequesterRequestCard({ request }) {
    const [donations, setDonations] = useState([]);
    const [showDonorModal, setShowDonorModal] = useState(false);

    useEffect(() => {
      const q = query(collection(db, 'requests', request.id, 'donations'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }, [request.id]);

    const handleVerifyDonorOtp = async (donation, enteredOtp) => {
      if (enteredOtp === donation.donorOtp) {
        try {
          const donationRef = doc(db, 'requests', request.id, 'donations', donation.id);
          await updateDoc(donationRef, { requesterOtpVerified: true });
          alert('OTP verified successfully.');
        } catch (error) {
          console.error('Error verifying donor OTP:', error);
        }
      } else {
        alert('Incorrect OTP entered.');
      }
    };

    // DonationItem displays limited donor details, OTP entry and verification UI.
    function DonationItem({ donation }) {
      const [donorDetails, setDonorDetails] = useState(null);
      const [enteredOtp, setEnteredOtp] = useState('');
      const [showMoreModal, setShowMoreModal] = useState(false);

      useEffect(() => {
        const fetchDonorDetails = async () => {
          const userDoc = await getDoc(doc(db, 'users', donation.donorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.email) {
              const q = query(collection(db, 'donors'), where('Email', '==', userData.email));
              const donorSnapshot = await getDocs(q);
              if (!donorSnapshot.empty) {
                setDonorDetails(donorSnapshot.docs[0].data());
              } else {
                setDonorDetails({ Email: userData.email });
              }
            }
          }
        };
        fetchDonorDetails();
      }, [donation.donorId]);

      // Only display these details to protect donor privacy.
      const displayDetails = {
        Name: donorDetails?.Name,
        Age: donorDetails?.Age,
        BloodGroup: donorDetails?.BloodGroup,
        Gender: donorDetails?.Gender,
        Email: donorDetails?.Email,
        MobileNumber: donorDetails?.MobileNumber
      };

      return (
        <div className="p-4 border rounded-lg my-3 bg-white shadow-lg">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800">
              {displayDetails.Name ? displayDetails.Name : donation.donorId}
            </p>
            <Button 
              onClick={() => setShowMoreModal(true)} 
              className="px-4 py-1 text-sm border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-full transition-colors"
            >
              More
            </Button>
          </div>
          <p className="mt-2 text-gray-600 text-sm"><strong>Your OTP:</strong> {donation.requesterOtp}</p>
          {donation.requesterOtpVerified ? (
            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
              <p className="text-green-800 font-bold text-center">Donation completed</p>
            </div>
          ) : (
            <div className="mt-3">
              <OtpInput onChange={setEnteredOtp} />
              <Button
                onClick={() => handleVerifyDonorOtp(donation, enteredOtp)}
                className="mt-3 w-full bg-red-600 text-white py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                Verify Donor OTP
              </Button>
            </div>
          )}
          <Dialog open={showMoreModal} onOpenChange={(open) => setShowMoreModal(open)}>
            <DialogContent className="max-h-[80vh] overflow-y-auto bg-white rounded-lg p-6 shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-red-700">
                  Donor Details for {request.PatientName}
                </DialogTitle>
              </DialogHeader>
              {donorDetails ? (
                <div className="space-y-3 text-gray-800">
                  {displayDetails.Name && (
                    <div>
                      <strong>Name:</strong> {displayDetails.Name}
                    </div>
                  )}
                  {displayDetails.Age && (
                    <div>
                      <strong>Age:</strong> {displayDetails.Age}
                    </div>
                  )}
                  {displayDetails.BloodGroup && (
                    <div>
                      <strong>Blood Group:</strong> {displayDetails.BloodGroup}
                    </div>
                  )}
                  {displayDetails.Gender && (
                    <div>
                      <strong>Gender:</strong> {displayDetails.Gender}
                    </div>
                  )}
                  {displayDetails.Email && (
                    <div>
                      <strong>Email:</strong> {displayDetails.Email}
                    </div>
                  )}
                  {displayDetails.MobileNumber && (
                    <div>
                      <strong>Phone Number:</strong> {displayDetails.MobileNumber}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No additional details found.</p>
              )}
              <Button
                onClick={() => setShowMoreModal(false)}
                className="mt-4 w-full bg-red-600 text-white py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8 transition hover:shadow-2xl">
        <h2 className="text-2xl font-bold text-red-700 mb-2">{request.PatientName}</h2>
        <p className="text-gray-700"><strong>Blood Group:</strong> {request.BloodGroup}</p>
        <p className="text-gray-700"><strong>Units Needed:</strong> {request.UnitsNeeded}</p>
        <p className="text-gray-700"><strong>Units Donated:</strong> {request.UnitsDonated || 0}</p>
        <p className="mt-3">
          <strong>Status:</strong> {request.Verified === 'received' ? 'Pending' : request.Verified}
        </p>
        <Button
          onClick={() => setShowDonorModal(true)}
          className="mt-4 w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
        >
          View Donors
        </Button>
        <Dialog open={showDonorModal} onOpenChange={(open) => setShowDonorModal(open)}>
          <DialogContent className="max-h-[80vh] overflow-y-auto bg-white rounded-lg p-6 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-700">
                Donor Details for {request.PatientName}
              </DialogTitle>
            </DialogHeader>
            {donations.length > 0 ? (
              donations.map(donation => (
                <DonationItem key={donation.id} donation={donation} />
              ))
            ) : (
              <p className="text-gray-600 mt-4">No donations yet.</p>
            )}
            <Button
              onClick={() => setShowDonorModal(false)}
              className="mt-6 w-full bg-red-600 text-white py-3 rounded-full hover:bg-red-700 transition-colors"
            >
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const tabStatuses = ['accepted', 'rejected', 'completed', 'received'];
  const filteredRequests = myRequests.filter(req => req.Verified === activeTab);

  return (
    <div className="min-h-screen bg-red-50">
      <Navbar />
      <header className="bg-gradient-to-r from-red-600 to-red-900 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">My Requests</h1>
          <p className="mt-3 text-xl">Manage your blood requests with ease</p>
        </div>
      </header>
      <main className="min-h-screen container mx-auto px-4 py-10">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabStatuses.map(status => (
            <Button
              key={status}
              variant={activeTab === status ? 'default' : 'outline'}
              onClick={() => setActiveTab(status)}
              className={`rounded-full px-6 py-2 text-lg transition-colors ${
                activeTab === status 
                  ? 'bg-red-700 text-white'
                  : 'border border-red-700 text-red-700 hover:bg-red-700 hover:text-white'
              }`}
            >
              {status === 'received' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        {filteredRequests.length === 0 ? (
          <p className="text-center text-gray-600 text-xl">No {activeTab} requests available.</p>
        ) : (
          filteredRequests.map(request => (
            <RequesterRequestCard key={request.id} request={request} />
          ))
        )}
      </main>
      <footer className="bg-red-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Kurudhi Kodai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
