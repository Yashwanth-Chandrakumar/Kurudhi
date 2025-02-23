'use client'

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export default function DonorDashboard() {
  const { user } = useAuth();
  const [ongoingRequests, setOngoingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  // State to control which tab is active in My Requests
  const [activeTab, setActiveTab] = useState('accepted');
  // Fetch donor's record from donors collection (using user's email)
  const [donorRecord, setDonorRecord] = useState(null);

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

  // Helper function to determine status color
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

  // Function to recalc verified donations and mark as completed if needed.
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

  // Listen for accepted requests (Donor Side)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('Verified', '==', 'accepted'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOngoingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Listen for requests raised by the current user (Requester Side)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('uuid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Utility for generating OTP
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  // ----------------- Donor Side Component -----------------
  function DonorRequestCard({ request, donorRecord }) {
    const [donation, setDonation] = useState(null);
    const [enteredOtp, setEnteredOtp] = useState('');

    // Check donor eligibility based on lastDonated date.
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
          // Update donor record with lastDonated date
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
      <div className="border p-4 rounded-lg mb-4">
        <p><strong>Patient:</strong> {request.PatientName}</p>
        <p><strong>Blood Group:</strong> {request.BloodGroup}</p>
        <p><strong>Units Needed:</strong> {request.UnitsNeeded}</p>
        <p><strong>Units Donated:</strong> {request.UnitsDonated || 0}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`${getStatusColor(request.Verified)} px-2 py-1 rounded`}>
            {request.Verified}
          </span>
        </p>
        {donation ? (
          donation.donorOtpVerified ? (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p><strong>Your OTP:</strong> {donation.donorOtp}</p>
              <p className="text-green-600 font-bold">Donation Verified</p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p><strong>Your OTP:</strong> {donation.donorOtp}</p>
              <p><strong>Requester's OTP:</strong> {donation.requesterOtp}</p>
              <Input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="Enter Requester's OTP"
                className="mt-2"
              />
              <Button onClick={handleVerifyRequesterOtp} className="mt-2">
                Verify Requester's OTP
              </Button>
            </div>
          )
        ) : (
          <Button onClick={handleDonateClick} className="mt-2" disabled={!canDonate()}>
            {canDonate() ? 'Donate Blood' : 'Cannot Donate (Wait 30 Days)'}
          </Button>
        )}
      </div>
    );
  }

  // ----------------- Requester Side Component -----------------
  function RequesterRequestCard({ request }) {
    const [donations, setDonations] = useState([]);
    const [showDonorModal, setShowDonorModal] = useState(false);

    useEffect(() => {
      const q = query(collection(db, 'requests', request.id, 'donations'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDonations(docs);
      });
      return () => unsubscribe();
    }, [request.id]);

    const handleVerifyDonorOtp = async (donation, enteredOtp) => {
      if (enteredOtp === donation.donorOtp) {
        try {
          const donationRef = doc(db, 'requests', request.id, 'donations', donation.id);
          await updateDoc(donationRef, { requesterOtpVerified: true });
          alert('OTP verified successfully.');
          checkDonationCompletion(request.id);
        } catch (error) {
          console.error('Error verifying donor OTP:', error);
        }
      } else {
        alert('Incorrect OTP entered.');
      }
    };

    // Updated DonationItem with a More button for complete details.
    function DonationItem({ donation }) {
      const [donorDetails, setDonorDetails] = useState(null);
      const [enteredOtp, setEnteredOtp] = useState('');
      const [showMoreModal, setShowMoreModal] = useState(false);

      useEffect(() => {
        const fetchDonorDetails = async () => {
          // First fetch from users collection to get donor email.
          const userDoc = await getDoc(doc(db, 'users', donation.donorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.email) {
              // Now query donors collection using the email.
              const q = query(collection(db, 'donors'), where('Email', '==', userData.email));
              const donorSnapshot = await getDocs(q);
              if (!donorSnapshot.empty) {
                const donorDoc = donorSnapshot.docs[0];
                setDonorDetails(donorDoc.data());
              } else {
                setDonorDetails({ email: userData.email });
              }
            }
          }
        };
        fetchDonorDetails();
      }, [donation.donorId]);

      return (
        <div className="p-2 border rounded my-2">
          <p className='flex justify-around items-center'>
            <strong>Donor:</strong>{' '}
            {donorDetails
              ? `${donorDetails.Name || ''} ${donorDetails.MobileNumber ? '- ' + donorDetails.MobileNumber : ''}`
              : donation.donorId}
              <Button onClick={() => setShowMoreModal(true)} className="mt-2">
            More
          </Button>
          </p>
          <p><strong>Your OTP:</strong> {donation.requesterOtp}</p>
          {!donation.requesterOtpVerified && (
            <div className="mt-2">
              <Input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="Enter Donor OTP"
                className="mt-1"
              />
              <Button
                onClick={() => handleVerifyDonorOtp(donation, enteredOtp)}
                className="mt-2"
              >
                Verify Donor OTP
              </Button>
            </div>
          )}
          
          <Dialog open={showMoreModal} onOpenChange={setShowMoreModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Donor Details</DialogTitle>
              </DialogHeader>
              {donorDetails ? (
                <div className="space-y-2">
                  {Object.entries(donorDetails).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {value.toString()}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No additional details found.</p>
              )}
              <Button onClick={() => setShowMoreModal(false)} className="mt-4">
                Close
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className="border p-4 rounded-lg mb-4">
        <p><strong>Patient:</strong> {request.PatientName}</p>
        <p><strong>Blood Group:</strong> {request.BloodGroup}</p>
        <p><strong>Units Needed:</strong> {request.UnitsNeeded}</p>
        <p><strong>Units Donated:</strong> {request.UnitsDonated || 0}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`${getStatusColor(request.Verified)} px-2 py-1 rounded`}>
            {request.Verified}
          </span>
        </p>
        <Button onClick={() => setShowDonorModal(true)} className="mt-2">
          View Donors
        </Button>

        <Dialog open={showDonorModal} onOpenChange={(open) => setShowDonorModal(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donor Details for {request.PatientName}</DialogTitle>
            </DialogHeader>
            {donations.length > 0 ? (
              donations.map(donation => (
                <DonationItem key={donation.id} donation={donation} />
              ))
            ) : (
              <p>No donations yet.</p>
            )}
            <Button onClick={() => setShowDonorModal(false)} className="mt-4">
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------------------- My Requests Tabs --------------------
  const tabStatuses = ['accepted', 'rejected', 'completed', 'received', 'unknown'];
  const filteredRequests = myRequests.filter(req => {
    const status = req.Verified || 'unknown';
    return status === activeTab;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Donor Dashboard</h1>

      {/* Section 1: Accepted Requests (Donor Side) */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Accepted Requests (Donor Side)</h2>
        {ongoingRequests.length === 0 ? (
          <p>No accepted requests available.</p>
        ) : (
          ongoingRequests.map(request => (
            <DonorRequestCard key={request.id} request={request} donorRecord={donorRecord} />
          ))
        )}
      </section>

      {/* Section 2: My Requests (Requester Side) with Tabs */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">My Requests (Requester Side)</h2>
        <div className="flex space-x-2 mb-4">
          {tabStatuses.map(status => (
            <Button
              key={status}
              variant={activeTab === status ? 'default' : 'outline'}
              onClick={() => setActiveTab(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        {filteredRequests.length === 0 ? (
          <p>No {activeTab} requests available.</p>
        ) : (
          filteredRequests.map(request => (
            <RequesterRequestCard key={request.id} request={request} />
          ))
        )}
      </section>
    </div>
  );
}
