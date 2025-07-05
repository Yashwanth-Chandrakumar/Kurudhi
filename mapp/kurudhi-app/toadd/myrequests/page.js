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
import {
    Activity,
    AlertCircle,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Droplet,
    FileText,
    HeartHandshake,
    ListChecks,
    Users
} from 'lucide-react';

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

function OtpInput({ length = 6, onChange, inputClassName = "w-10 h-10 text-center border rounded-md bg-gray-100 text-red-700 shadow-sm focus:ring-2 focus:ring-red-500" }) {
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
    <div className="flex justify-center gap-2">
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
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}

function StatsCard({ icon, title, value, color }) {
    const Icon = icon;
    return (
        <div className={`p-4 rounded-xl shadow-lg flex items-center space-x-4 bg-white border-l-4 ${color}`}>
            <div className="p-3 bg-gray-100 rounded-full">
                <Icon className="w-6 h-6 text-gray-700" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('accepted');
  const [stats, setStats] = useState({
      total: 0,
      pending: 0,
      completed: 0,
      unitsReceived: 0
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('uuid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyRequests(requestsData);

      // Calculate stats
      const total = requestsData.length;
      const pending = requestsData.filter(r => r.Verified === 'accepted' || r.Verified === 'received').length;
      const completed = requestsData.filter(r => r.Verified === 'completed').length;
      const unitsReceived = requestsData.reduce((acc, req) => acc + (parseInt(req.UnitsDonated) || 0), 0);

      setStats({ total, pending, completed, unitsReceived });
    });
    return () => unsubscribe();
  }, [user]);

  function RequesterRequestCard({ request }) {
    const [donations, setDonations] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
      const q = query(collection(db, 'requests', request.id, 'donations'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }, [request.id]);

    const getStatusChip = (status) => {
        switch(status) {
            case 'completed': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
            case 'accepted': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Active</span>;
            case 'received': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
            case 'rejected': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected</span>;
            default: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
      <div className="bg-white rounded-2xl shadow-md mb-4 border border-gray-200 overflow-hidden">
        <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{request.PatientName}</h2>
                    <p className="text-sm text-gray-500">For: {request.Reason}</p>
                </div>
                <div className="flex items-center space-x-3">
                    {getStatusChip(request.Verified)}
                    <button className="p-1 rounded-full hover:bg-gray-100">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>
            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                    <Droplet size={16} className="text-red-500" />
                    <span>{request.BloodGroup}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <HeartHandshake size={16} className="text-blue-500" />
                    <span>{request.UnitsDonated || 0} / {request.UnitsNeeded} Units</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Users size={16} className="text-green-500" />
                    <span>{donations.length} Donor(s)</span>
                </div>
            </div>
        </div>
        {isExpanded && (
            <div className="bg-gray-50/50 p-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-700 mb-2">Donors List</h3>
                {donations.length > 0 ? (
                    <div className="space-y-3">
                        {donations.map(donation => (
                            <DonationItem key={donation.id} donation={donation} request={request} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">No donors have responded yet.</p>
                )}
            </div>
        )}
      </div>
    );
  }

  function DonationItem({ donation, request }) {
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
              setDonorDetails({ Name: 'Anonymous Donor', Email: userData.email });
            }
          }
        }
      };
      fetchDonorDetails();
    }, [donation.donorId]);

    const handleVerifyDonorOtp = async () => {
      if (enteredOtp === donation.donorOtp) {
        try {
          const donationRef = doc(db, 'requests', request.id, 'donations', donation.id);
          await updateDoc(donationRef, { requesterOtpVerified: true });
          alert('OTP verified successfully. Donation is now complete!');
        } catch (error) {
          console.error('Error verifying donor OTP:', error);
          alert('Failed to verify OTP. Please try again.');
        }
      } else {
        alert('Incorrect OTP entered.');
      }
    };

    const getStatusPill = () => {
        if (donation.requesterOtpVerified) {
            return <div className="flex items-center space-x-2 text-green-600"><Check size={16} /><span className="font-semibold">Completed</span></div>;
        }
        if (donation.donorOtpVerified) {
            return <div className="flex items-center space-x-2 text-blue-600"><Clock size={16} /><span className="font-semibold">Donor Confirmed</span></div>;
        }
        return <div className="flex items-center space-x-2 text-yellow-600"><AlertCircle size={16} /><span className="font-semibold">Pending</span></div>;
    }

    return (
      <div className="p-3 border rounded-lg bg-white shadow-sm">
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold text-gray-800">
                    {donorDetails?.Name || 'Loading...'}
                </p>
                <p className="text-sm text-gray-500">Your OTP for this donor: <span className="font-bold text-red-600">{donation.requesterOtp}</span></p>
            </div>
            <div className="flex items-center space-x-2">
                {getStatusPill()}
                <Button variant="outline" size="sm" onClick={() => setShowMoreModal(true)}>Details</Button>
            </div>
        </div>
        {!donation.requesterOtpVerified && donation.donorOtpVerified && (
            <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-center text-gray-600 mb-2">Enter OTP from Donor to confirm donation</p>
                <div className="flex items-center justify-center gap-3">
                    <OtpInput onChange={setEnteredOtp} />
                    <Button onClick={handleVerifyDonorOtp} className="bg-red-600 hover:bg-red-700 text-white">Verify</Button>
                </div>
            </div>
        )}
        <Dialog open={showMoreModal} onOpenChange={setShowMoreModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Donor Details</DialogTitle>
                </DialogHeader>
                {donorDetails ? (
                    <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {donorDetails.Name}</p>
                        <p><strong>Email:</strong> {donorDetails.Email}</p>
                        <p><strong>Phone:</strong> {donorDetails.MobileNumber || 'Not provided'}</p>
                        <p><strong>Blood Group:</strong> {donorDetails.BloodGroup}</p>
                    </div>
                ) : <p>Loading details...</p>}
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  const tabStatuses = ['accepted', 'completed', 'received', 'rejected'];
  const filteredRequests = myRequests.filter(req => activeTab === 'all' || req.Verified === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Requests</h1>
          <p className="text-gray-500">Track and manage all your blood donation requests.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard icon={FileText} title="Total Requests" value={stats.total} color="border-blue-500" />
            <StatsCard icon={Activity} title="Pending/Active" value={stats.pending} color="border-yellow-500" />
            <StatsCard icon={ListChecks} title="Completed" value={stats.completed} color="border-green-500" />
            <StatsCard icon={Droplet} title="Units Received" value={stats.unitsReceived} color="border-red-500" />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-2 mb-6 flex space-x-2">
          {tabStatuses.map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 text-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === status 
                  ? 'bg-red-600 text-white shadow'
                  : 'text-gray-600 hover:bg-red-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div>
            {filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                    <RequesterRequestCard key={request.id} request={request} />
                ))
            ) : (
                <div className="text-center py-16">
                    <p className="text-gray-500">No requests found in the '{activeTab}' category.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
