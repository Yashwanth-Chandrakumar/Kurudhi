"use client";
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import html2canvas from 'html2canvas';
import {
  Activity, AlertCircle,
  Check, ChevronDown, ChevronRight, Clock,
  Droplet,
  Hospital, Info, MapPin, Share2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Firebase configuration
const firebaseConfig = {
  // Your Firebase config
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// OTP Input Component
function OtpInput({ length = 6, onChange, inputClassName = "w-12 h-12 text-center border border-white rounded-lg bg-white text-red-700 shadow-md" }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);
  
  useEffect(() => {
    onChange(otp.join(""));
  }, [otp, onChange]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    // Only take the last char if multiple chars are pasted
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    
    // Move to next input if current field is filled
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current field is empty
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {otp.map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          className={inputClassName}
          value={otp[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          maxLength={1}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [donorRecord, setDonorRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [expandedCard, setExpandedCard] = useState(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    unitsNeeded: 0
  });

  // Get donor record
  useEffect(() => {
    if (!user?.email) return;

    const fetchDonorRecord = async () => {
      try {
        const q = query(collection(db, "donors"), where("Email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setDonorRecord(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching donor record:", error);
      }
    };

    fetchDonorRecord();
  }, [user]);

  // Get blood requests
  useEffect(() => {
    const q = query(collection(db, "requests"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = [];
      let activeRequestsCount = 0;
      let myBloodTypeRequestsCount = 0;
      let completed = 0;
      let totalActiveUnits = 0;

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        requestsData.push(data);
        
        // Update stats
        if (data.Verified === "completed") {
          completed++;
        } else if (data.Verified === "accepted") {
          activeRequestsCount++;
          totalActiveUnits += parseInt(data.UnitsNeeded) || 0;
          
          // Count requests matching donor's blood type
          if (donorRecord && data.BloodGroup === donorRecord.BloodGroup) {
            myBloodTypeRequestsCount++;
          }
        }
      });
      
      setRequests(requestsData);
      setStats({
        totalRequests: activeRequestsCount,
        pendingRequests: myBloodTypeRequestsCount,
        completedRequests: completed,
        unitsNeeded: totalActiveUnits
      });
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [donorRecord]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'received':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to check if donation is complete
  const checkDonationCompletion = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        const unitsNeeded = parseInt(requestData.UnitsNeeded);
        const unitsDonated = parseInt(requestData.UnitsDonated || 0);
        
        if (unitsDonated >= unitsNeeded) {
          await updateDoc(requestRef, {
            Verified: "completed"
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking donation completion:", error);
      return false;
    }
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'active') {
      return request.Verified === 'accepted';
    } else if (activeTab === 'completed') {
      return request.Verified === 'completed';
    } else if (activeTab === 'mytype' && donorRecord) {
      return request.BloodGroup === donorRecord.BloodGroup && request.Verified === 'accepted';
    }
    return true;
  });

  // Donor Request Card Component
  function DonorRequestCard({ request, donorRecord }) {
    const [donation, setDonation] = useState(null);
    const [enteredOtp, setEnteredOtp] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const cardRef = useRef(null);

    // Check donor eligibility based on last donation date.
    const canDonate = () => {
      if (!donorRecord?.lastDonationDate) return true;
      
      const lastDonation = new Date(donorRecord.lastDonationDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - lastDonation);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 30;
    };

    // Generate a 6-digit OTP
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleDonateClick = async () => {
      try {
        const donorOtp = generateOTP();
        const requesterOtp = generateOTP();
        
        // Add donation record
        const donationData = {
          requestId: request.id,
          donorId: user.uid,
          donorEmail: user.email,
          donorName: donorRecord.Name,
          donorOtp,
          requesterOtp,
          donorOtpVerified: false,
          requesterOtpVerified: false,
          timestamp: new Date(),
        };
        
        const docRef = await addDoc(collection(db, "donations"), donationData);
        setDonation({ id: docRef.id, ...donationData });
      } catch (error) {
        console.error("Error initiating donation:", error);
      }
    };

    const handleVerifyRequesterOtp = async () => {
      if (!donation || enteredOtp !== donation.requesterOtp) {
        alert("Invalid OTP. Please try again.");
        return;
      }
      
      try {
        // Update donation record
        await updateDoc(doc(db, "donations", donation.id), {
          donorOtpVerified: true
        });
        
        // Update request's donated units
        const requestRef = doc(db, "requests", request.id);
        const requestDoc = await getDoc(requestRef);
        if (requestDoc.exists()) {
          const currentDonated = parseInt(requestDoc.data().UnitsDonated || 0);
          await updateDoc(requestRef, {
            UnitsDonated: currentDonated + 1
          });
          
          // Update donor's last donation date
          const donorQuery = query(collection(db, "donors"), where("Email", "==", user.email));
          const donorSnapshot = await getDocs(donorQuery);
          if (!donorSnapshot.empty) {
            const donorRef = doc(db, "donors", donorSnapshot.docs[0].id);
            await updateDoc(donorRef, {
              lastDonationDate: new Date().toISOString().split('T')[0]
            });
          }
          
          // Check if donation is complete
          await checkDonationCompletion(request.id);
        }
        
        // Update local state
        setDonation({ ...donation, donorOtpVerified: true });
      } catch (error) {
        console.error("Error verifying OTP:", error);
      }
      
      setEnteredOtp('');
    };

    const handleShare = async () => {
      if (!cardRef.current) return;
      
      try {
        const canvas = await html2canvas(cardRef.current);
        const imageUrl = canvas.toDataURL();
        
        // Create share data
        const shareData = {
          title: 'Blood Donation Request',
          text: `Urgent blood donation needed!\nPatient: ${request.PatientName}\nBlood Group: ${request.BloodGroup}\nHospital: ${request.Hospital}\nCity: ${request.City}\n\nPlease help if you can!`,
          url: window.location.href
        };

        // Check if Web Share API is supported
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            console.log('Error sharing:', err);
          }
        } else {
          // Fallback for WhatsApp sharing
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
          window.open(whatsappUrl, '_blank');
        }
      } catch (err) {
        console.error('Error generating image:', err);
      }
    };

    const getStatusDisplay = (status, unitsNeeded, unitsDonated) => {
      if (status === 'completed') return 'Completed';
      const pending = unitsNeeded - (unitsDonated || 0);
      return `Pending (${pending} units needed)`;
    };

    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
      setExpandedCard(isExpanded ? null : request.id);
    };

    // Blood group badge color based on type
    const getBloodGroupColor = (bloodGroup) => {
      const colors = {
        'A+': 'bg-red-100 text-red-800',
        'A-': 'bg-red-200 text-red-900',
        'B+': 'bg-blue-100 text-blue-800',
        'B-': 'bg-blue-200 text-blue-900',
        'AB+': 'bg-purple-100 text-purple-800',
        'AB-': 'bg-purple-200 text-purple-900',
        'O+': 'bg-green-100 text-green-800',
        'O-': 'bg-green-200 text-green-900',
      };
      return colors[bloodGroup] || 'bg-gray-100 text-gray-800';
    };

    return (
      <div
        ref={cardRef}
        className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 ${
          isExpanded ? 'shadow-xl transform scale-[1.02] animate-pulse-shadow' : 'hover:shadow-lg'
        }`}
      >
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">{request.PatientName}</h2>
                <span className={`${getBloodGroupColor(request.BloodGroup)} px-2 py-1 rounded-full text-xs font-bold`}>
                  {request.BloodGroup}
                </span>
              </div>
              <div className="flex items-center mt-1 text-gray-500 text-sm">
                <Hospital className="w-4 h-4 mr-1" /> {request.Hospital}
                <span className="mx-2">•</span>
                <MapPin className="w-4 h-4 mr-1" /> {request.City}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Share Request"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500">Needed</div>
                <div className="font-bold text-gray-800 flex items-center">
                  <Droplet className="w-4 h-4 mr-1 text-red-500" />
                  {request.UnitsNeeded}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500">Donated</div>
                <div className="font-bold text-gray-800 flex items-center">
                  <Activity className="w-4 h-4 mr-1 text-green-500" />
                  {request.UnitsDonated || 0}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500">Status</div>
                <div className={`${getStatusColor(request.Verified)} px-3 py-1 rounded-full text-xs font-bold`}>
                  {request.Verified === 'completed' ? (
                    <span className="flex items-center"><Check className="w-3 h-3 mr-1" /> Complete</span>
                  ) : (
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Request Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="text-gray-500">Patient:</span> {request.PatientName}</p>
                    <p><span className="text-gray-500">Blood Group:</span> {request.BloodGroup}</p>
                    <p><span className="text-gray-500">Units Needed:</span> {request.UnitsNeeded}</p>
                    <p><span className="text-gray-500">Units Pending:</span> {request.UnitsNeeded - (request.UnitsDonated || 0)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Location Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="text-gray-500">Hospital:</span> {request.Hospital}</p>
                    <p><span className="text-gray-500">City:</span> {request.City}</p>
                    <p><span className="text-gray-500">Contact:</span> {request.PhoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {donation ? (
                donation.donorOtpVerified ? (
                  <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center text-green-800 font-bold">
                      <Check className="w-5 h-5 mr-2" />
                      Donation completed
                    </div>
                    <p className="text-green-700 text-sm mt-1">Thank you for your donation! Your OTP: <strong>{donation.donorOtp}</strong></p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <div className="flex items-center text-yellow-800 font-medium mb-3">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Verify the requester's OTP to complete donation
                    </div>
                    <p className="text-yellow-700 mb-3">Your OTP: <strong>{donation.donorOtp}</strong></p>
                    <OtpInput 
                      onChange={setEnteredOtp}
                      inputClassName="w-10 h-10 text-center border border-yellow-200 rounded-lg bg-white text-gray-700 shadow-sm focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50"
                    />
                    <Button
                      onClick={handleVerifyRequesterOtp}
                      className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Verify OTP
                    </Button>
                  </div>
                )
              ) : (
                donorRecord && donorRecord.BloodGroup === request.BloodGroup ? (
                  <Button 
                    onClick={handleDonateClick} 
                    disabled={!canDonate() || request.Verified === 'completed'}
                    className={`mt-4 w-full py-2 rounded-lg font-medium transition-all ${
                      canDonate() && request.Verified !== 'completed'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {request.Verified === 'completed' 
                      ? 'Donation Complete' 
                      : !canDonate() 
                        ? 'Cannot Donate (Wait 30 Days)' 
                        : 'Donate Blood'}
                  </Button>
                ) : (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-center text-sm text-gray-500">
                    Blood group mismatch. You cannot donate for this request.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Stats card  
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-50')}`}>
          <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  // Loading Skeleton
  const RequestSkeleton = () => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-5">
        <div className="flex justify-between">
          <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-3/4 h-4 bg-gray-200 rounded mt-2"></div>
        <div className="flex mt-4 gap-4">
          <div className="w-1/4 h-12 bg-gray-200 rounded"></div>
          <div className="w-1/4 h-12 bg-gray-200 rounded"></div>
          <div className="w-1/4 h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Blood Donation Dashboard</h1>
            <p className="text-gray-600 mt-2">
              {donorRecord 
                ? `Welcome back, ${donorRecord.Name}. You are a registered donor with blood type ${donorRecord.BloodGroup}.` 
                : user 
                  ? "You're not registered as a donor yet. Consider becoming a donor to help save lives." 
                  : "Please sign in to access your donation dashboard."
              }
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stagger-item animate-staggered">
              <StatCard 
                title="Active Requests" 
                value={stats.totalRequests} 
                icon={AlertCircle} 
                color="border-blue-500" 
              />
            </div>
            <div className="stagger-item animate-staggered">
              <StatCard 
                title="My Blood Type" 
                value={stats.pendingRequests} 
                icon={Clock} 
                color="border-yellow-500" 
              />
            </div>
            <div className="stagger-item animate-staggered">
              <StatCard 
                title="Completed" 
                value={stats.completedRequests} 
                icon={Check} 
                color="border-green-500" 
              />
            </div>
            <div className="stagger-item animate-staggered">
              <StatCard 
                title="Active Units Needed" 
                value={stats.unitsNeeded} 
                icon={Droplet} 
                color="border-red-500" 
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'active' 
                  ? 'border-b-2 border-red-600 text-red-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active Requests
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'mytype' 
                  ? 'border-b-2 border-red-600 text-red-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('mytype')}
            >
              My Blood Type
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'completed' 
                  ? 'border-b-2 border-red-600 text-red-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
          </div>

          {/* Request List */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <RequestSkeleton />
                <RequestSkeleton />
                <RequestSkeleton />
              </>
            ) : filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map((request, index) => (
                  <div 
                    key={request.id} 
                    className="stagger-item animate-staggered"
                  >
                    <DonorRequestCard request={request} donorRecord={donorRecord} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Info className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                <p className="mt-1 text-gray-500">
                  {activeTab === 'active'
                    ? "There are currently no active blood donation requests."
                    : activeTab === 'mytype'
                    ? `There are no active requests matching your blood type (${donorRecord?.BloodGroup || 'Unknown'}).`
                    : "There are no completed donation requests."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
