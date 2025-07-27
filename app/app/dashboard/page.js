"use client";
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
    where,
    deleteDoc,
    increment
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
  const [userDonations, setUserDonations] = useState([]);
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
  }, [user, userDonations]);

  // Get user's donations
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserDonations = async () => {
      try {
        // Get all requests
        const requestsQuery = query(collection(db, "requests"));
        const requestsSnapshot = await getDocs(requestsQuery);
        
        let userDonationsList = [];
        
        // For each request, check for user's donations
        for (const requestDoc of requestsSnapshot.docs) {
          const requestId = requestDoc.id;
          const donationsRef = collection(db, "requests", requestId, "donations");
          const userDonationsQuery = query(donationsRef, where("donorId", "==", user.uid));
          const userDonationsSnapshot = await getDocs(userDonationsQuery);
          
          userDonationsSnapshot.forEach(donationDoc => {
            userDonationsList.push({ 
              requestId: requestId,
              ...donationDoc.data() 
            });
          });
        }
        
        setUserDonations(userDonationsList);
      } catch (error) {
        console.error("Error fetching user donations:", error);
      }
    };

    fetchUserDonations();
  }, [user, db]);

  // Get blood requests
  useEffect(() => {
    const q = query(collection(db, "requests"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = [];
      let activeRequestsCount = 0;
      let myBloodTypeRequestsCount = 0;
      let totalActiveUnits = 0;

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        requestsData.push(data);
        
        if (data.Verified === "accepted") {
          // Count active requests for all users
          activeRequestsCount++;
          
          // Only count units needed for eligible requests (matching blood type or accepts any)
          if (donorRecord && (data.BloodGroup === donorRecord.BloodGroup || data.AnyBloodGroupAccepted === true)) {
            myBloodTypeRequestsCount++;
            totalActiveUnits += parseInt(data.UnitsNeeded) || 0;
          }
        }
      });

      // Calculate completed requests based on user's verified donations
      const completedUserRequests = userDonations.filter(d => d.requesterOtpVerified === true).length;
      
      setRequests(requestsData);
      setStats({
        totalRequests: activeRequestsCount,
        pendingRequests: myBloodTypeRequestsCount,
        completedRequests: completedUserRequests,
        unitsNeeded: totalActiveUnits
      });
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [donorRecord, userDonations]);

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
        
        if (unitsDonated >= unitsNeeded && requestData.Verified !== 'completed') {
          await updateDoc(requestRef, {
            Verified: "completed"
          });
          return "completed";
        }
        return requestData.Verified;
      }
      return null;
    } catch (error) {
      console.error("Error checking donation completion:", error);
      return null;
    }
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'active') {
      return request.Verified === 'accepted';
    } else if (activeTab === 'completed') {
      // Show requests where the user has a completed (requester verified) donation
      const completedDonationRequestIds = userDonations
        .filter(donation => donation.requesterOtpVerified === true)
        .map(donation => donation.requestId);
      return completedDonationRequestIds.includes(request.id);
    } else if (activeTab === 'mytype' && donorRecord) {
      // Return requests matching user's blood group OR requests that accept any blood group
      return (request.BloodGroup === donorRecord.BloodGroup || request.AnyBloodGroupAccepted === true) && request.Verified === 'accepted';
    }
    return true;
  });

  function DonorRequestCard({ request, donorRecord }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [donation, setDonation] = useState(null);
    const [enteredOtp, setEnteredOtp] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const shareUrlRef = useRef(null);
    const cardRef = useRef(null);

    // Add useEffect to refresh donation status when donorRecord changes
    useEffect(() => {
      const refreshDonationStatus = () => {
        // If user has recently donated elsewhere, and has a pending donation here
        if (donation && !donation.donorOtpVerified && !canDonate) {
          // Update the UI immediately (we don't update the database as the donation record remains valid,
          // but the UI will show it can't be completed now)
          console.log("Donation in progress but user cannot donate now due to recent donation elsewhere");
        }
      };
      
      refreshDonationStatus();
    }, [donorRecord, donation]);

    // Add useEffect to fetch existing donation with real-time updates
    useEffect(() => {
      if (!user || !request.id) return;

      const donationsRef = collection(db, "requests", request.id, "donations");
      const q = query(donationsRef, where("donorId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const donationDoc = querySnapshot.docs[0];
          setDonation({ id: donationDoc.id, ...donationDoc.data() });
        } else {
          setDonation(null);
        }
      }, (error) => {
        console.error("Error fetching existing donation:", error);
      });

      return () => unsubscribe();
    }, [user, request.id]);

    const getCooldownDetails = () => {
      if (!donorRecord?.lastDonationDate) {
        return { canDonate: true, remainingDays: 0 };
      }

      // Support Firestore Timestamp, Date string, or JS Date
      let lastDonation;
      if (typeof donorRecord.lastDonationDate === 'object' && typeof donorRecord.lastDonationDate.toDate === 'function') {
        // Firestore Timestamp
        lastDonation = donorRecord.lastDonationDate.toDate();
      } else {
        lastDonation = new Date(donorRecord.lastDonationDate);
      }

      // If parsing failed, allow donation to avoid blocking user erroneously
      if (isNaN(lastDonation)) {
        return { canDonate: true, remainingDays: 0 };
      }

      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - lastDonation);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const cooldownPeriod = 90;
      const canDonate = diffDays >= cooldownPeriod;
      const remainingDays = canDonate ? 0 : cooldownPeriod - diffDays;
      return { canDonate, remainingDays };
    };

    const { canDonate, remainingDays } = getCooldownDetails();

    // Generate a 6-digit OTP
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleDonateClick = async () => {
      try {
        const donorOtp = generateOTP();
        const requesterOtp = generateOTP();
        
        // Add donation record to subcollection of requests
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
        
        const donationsRef = collection(db, "requests", request.id, "donations");
        const docRef = await addDoc(donationsRef, donationData);
        setDonation({ id: docRef.id, ...donationData });
      } catch (error) {
        console.error("Error initiating donation:", error);
      }
    };

    const handleCancelClick = () => {
      setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
      if (!donation || !cancelReason.trim()) {
        alert("Please provide a reason for cancellation.");
        return;
      }
      try {
        // Add cancellation reason to a new subcollection
        const cancellationData = {
          donorId: user.uid,
          donorEmail: user.email,
          donorName: donorRecord.Name,
          reason: cancelReason,
          timestamp: new Date(),
        };
        await addDoc(collection(db, "requests", request.id, "cancellations"), cancellationData);

        // Delete the original donation document
        await deleteDoc(doc(db, "requests", request.id, "donations", donation.id));

        // Reset state
        setDonation(null);
        setEnteredOtp('');
        setShowCancelModal(false);
        setCancelReason('');
      } catch (error) {
        console.error("Error confirming cancellation:", error);
        alert("Failed to cancel donation. Please try again.");
      }
    };

    const handleVerifyRequesterOtp = async () => {
      if (!donation || enteredOtp !== donation.requesterOtp) {
        alert("Invalid OTP. Please try again.");
        return;
      }
      
      if (!canDonate) {
        alert(`You can donate again in ${remainingDays} day${remainingDays === 1 ? '' : 's'}.`);
        return;
      }
      
      try {
        // Update donation record in the subcollection
        await updateDoc(doc(db, "requests", request.id, "donations", donation.id), {
          donorOtpVerified: true
        });
        
        // Atomically increment the donated units
        const requestRef = doc(db, "requests", request.id);
        await updateDoc(requestRef, {
          UnitsDonated: increment(1)
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
        
        // Check if donation is complete and update tab if needed
        const newStatus = await checkDonationCompletion(request.id);
        if (newStatus === 'completed') {
          setActiveTab('completed');
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

      // Ensure the full card (including the expandable section) is visible in the screenshot
      const wasExpanded = isExpanded;
      if (!wasExpanded) {
        setIsExpanded(true);
        // Wait for the DOM to finish rendering the expanded content
        await new Promise(res => setTimeout(res, 300));
      }
    
      // Build dynamic share URL using the current origin
      const shareUrl = `${window.location.origin}/dashboard/#${request.id}`;
      const shareMessage = `Please help ${request.PatientName} who needs ${request.BloodGroup} blood at ${request.Hospital}, ${request.City}.`;
    
      try {
        /*
         * 1️⃣ First try: Web Share API without files (works on most iOS devices)
         */
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Blood Donation Request',
              text: shareMessage,
              url: shareUrl,
            });
            return;
          } catch (shareError) {
            console.log('Web Share API failed, trying fallback:', shareError);
            // Continue to fallback options
          }
        }
    
        /*
         * 2️⃣ Fallback: Try to generate image and share with files (newer iOS versions)
         */
        try {
          // Temporarily hide buttons so they don't appear in the screenshot
          const buttons = cardRef.current.querySelectorAll('button');
          buttons.forEach(btn => (btn.style.visibility = 'hidden'));
    
          // Generate a high-resolution image of the card
          const canvas = await html2canvas(cardRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            allowTaint: true,
            foreignObjectRendering: true,
          });
    
          // Restore button visibility
          buttons.forEach(btn => (btn.style.visibility = 'visible'));
    
          // Convert canvas to a PNG file
          const dataUrl = canvas.toDataURL('image/png');
          const blob = await (await fetch(dataUrl)).blob();
          const filesArray = [new File([blob], 'donation-request.png', { type: 'image/png' })];
    
          // Check if we can share files
          if (navigator.canShare && navigator.canShare({ files: filesArray })) {
            await navigator.share({
              files: filesArray,
              title: 'Blood Donation Request',
              text: `${shareMessage}\n${shareUrl}`,
            });
            return;
          }
        } catch (imageError) {
          console.log('Image sharing failed:', imageError);
          // Continue to next fallback
        }
    
        /*
         * 3️⃣ Copy to clipboard fallback (works well on iOS)
         */
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
            
            // Show a temporary success message
            const originalText = event.target.textContent;
            event.target.textContent = 'Copied!';
            event.target.style.backgroundColor = '#10B981';
            
            setTimeout(() => {
              event.target.textContent = originalText;
              event.target.style.backgroundColor = '';
            }, 2000);
            
            // Also show an alert
            alert('Link copied to clipboard! You can now paste it in any app to share.');
            return;
          } catch (clipboardError) {
            console.log('Clipboard failed:', clipboardError);
          }
        }
    
        /*
         * 4️⃣ Ultimate fallback: WhatsApp deep-link (works on all mobile devices)
         */
        const whatsappURL = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`;
        window.open(whatsappURL, '_blank');
    
      } catch (error) {
        console.error('All sharing methods failed:', error);
        
        /*
         * 5️⃣ Final fallback: Show a modal with the share text
         */
        const shareText = `${shareMessage}\n${shareUrl}`;
        
        // Create a simple modal to display the share text
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          box-sizing: border-box;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white;
          padding: 20px;
          border-radius: 10px;
          max-width: 400px;
          width: 100%;
        `;
        
        modalContent.innerHTML = `
          <h3 style="margin: 0 0 15px 0; color: #333;">Share this request</h3>
          <textarea readonly style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: none; font-size: 14px; box-sizing: border-box;">${shareText}</textarea>
          <p style="font-size: 12px; color: #666; margin: 10px 0;">Tap and hold the text above to copy it, then paste in any app to share.</p>
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px;">Close</button>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Auto-select the text for easy copying
        const textarea = modalContent.querySelector('textarea');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
      } finally {
        // Collapse the card back to its previous state after sharing
        if (!wasExpanded) {
          setIsExpanded(false);
        }
      }
    };

    const renderContent = () => {
      if (donation) {
        if (donation.requesterOtpVerified) {
          return (
            <div className="p-4 bg-green-50 border-t border-green-200">
              <div className="flex items-center font-bold text-green-800">
                <Check className="w-5 h-5 mr-2" />
                <span>Donation Completed!</span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Thank you for your life-saving contribution. Your donation has been successfully verified by the requester.
              </p>
            </div>
          );
        } else if (donation.donorOtpVerified) {
          return (
            <div className="p-4 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center font-bold text-blue-800">
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                <span>Awaiting Requester Confirmation</span>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Your part is done! Please ensure the requester confirms the donation with their OTP. Give this OTP to the requester: <strong>{donation.donorOtp}</strong>
              </p>
            </div>
          );
        } else {
          return (
            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-center font-bold text-yellow-800 mb-3">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Action Required: Verify Donation</span>
              </div>
              {!canDonate ? (
                <p className="text-sm text-red-600 font-medium">You can donate again in {remainingDays} day{remainingDays === 1 ? '' : 's'}.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    To complete the donation, please enter the 6-digit OTP provided by the requester.
                  </p>
                  <OtpInput 
                    onChange={setEnteredOtp}
                    inputClassName="w-10 h-10 text-center border border-yellow-300 rounded-lg bg-white text-gray-800 shadow-sm focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50"
                  />
                  <div className="mt-4 flex gap-3">
                    <Button onClick={handleVerifyRequesterOtp} className="w-full">Verify OTP</Button>
                    <Button variant="outline" onClick={handleCancelClick} className="w-full">Cancel</Button>
                  </div>
                </>
              )}
            </div>
          );
        }
      } else if (donorRecord && (donorRecord.BloodGroup === request.BloodGroup || request.AnyBloodGroupAccepted)) {
        return (
          <div className="p-4 bg-gray-50 border-t">
            <Button 
              onClick={handleDonateClick} 
              disabled={!canDonate || request.Verified === 'completed'}
              className={`w-full font-bold py-3 transition-all ${!canDonate || request.Verified === 'completed' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
              {request.Verified === 'completed' ? 'Request Fulfilled' : canDonate ? 'Donate Now' : `You can Donate in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`}
            </Button>
          </div>
        );
      } else {
        return (
          <div className="p-4 bg-gray-100 border-t text-center">
            <p className="text-sm text-gray-600">This request is not for your blood type.</p>
          </div>
        );
      }
    };
    
    const renderCancelModal = () => {
      if (!showCancelModal) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cancel Donation</h3>
            <p className="text-gray-600 mb-5">Please provide a reason for cancelling your donation pledge. This helps us improve our system.</p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              rows="4"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter your reason here..."
            ></textarea>
            <div className="flex justify-end gap-4 mt-5">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>Close</Button>
              <Button onClick={handleConfirmCancel} disabled={!cancelReason.trim()}>Submit</Button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div
        ref={cardRef}
        className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-lg' : ''}`}
      >
        <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <div className="flex items-center mb-1">
                <span className="font-bold text-lg text-gray-800 mr-2">{request.PatientName}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  request.EmergencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                  request.EmergencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.EmergencyLevel === 'high' ? 'High Emergency' :
                   request.EmergencyLevel === 'medium' ? 'Medium Emergency' :
                   'Low Emergency'}
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
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Share Request"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm text-gray-600">
            <Droplet className="w-4 h-4 mr-2 text-red-500" />
            <span>Blood Group: <span className="font-bold">{request.BloodGroup}</span></span>
            {request.RequestDate && (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                <span>{new Date(request.RequestDate.seconds * 1000).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100">
          {renderContent()}
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Request Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium text-gray-500">Patient:</span> {request.PatientName}</p>
                  <p><span className="font-medium text-gray-500">Blood Group:</span> {request.BloodGroup}</p>
                  <p><span className="font-medium text-gray-500">Units Needed:</span> {request.UnitsNeeded}</p>
                  <p><span className="font-medium text-gray-500">Units Pending:</span> {request.UnitsNeeded - (request.UnitsDonated || 0)}</p>
                  {request.EmergencyLevel && (
                    <p>
                      <span className="font-medium text-gray-500">Emergency:</span> 
                      <span className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        request.EmergencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                        request.EmergencyLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.EmergencyLevel.charAt(0).toUpperCase() + request.EmergencyLevel.slice(1)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Location & Attender</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium text-gray-500">Hospital:</span> {request.Hospital}</p>
                  <p><span className="font-medium text-gray-500">City:</span> {request.City}</p>
                  <p><span className="font-medium text-gray-500">Attender:</span> {request.AttenderName || 'N/A'}</p>
                  <p><span className="font-medium text-gray-500">Contact:</span> {request.AttenderMobile || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {renderCancelModal()}
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
            <div className="text-gray-600 mt-2">
              {donorRecord 
                ? <p>{`Welcome back, ${donorRecord.Name}. You are a registered donor with blood type ${donorRecord.BloodGroup}.`}</p>
                : user 
                  ? (
                      <div>
                        <p>You're not registered as a donor yet. Consider becoming a donor to help save lives.</p>
                        <Link href="/newdonor" passHref>
                          <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white">Become a Donor</Button>
                        </Link>
                      </div>
                    )
                  : <p>Please sign in to access your donation dashboard.</p>
              }
            </div>
          </div>

          {donorRecord && (
            <>
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
                    title="Eligible For Me" 
                    value={stats.pendingRequests} 
                    icon={Clock} 
                    color="border-yellow-500" 
                  />
                </div>
                <div className="stagger-item animate-staggered">
                  <StatCard 
                    title="My Completed Donations" 
                    value={stats.completedRequests} 
                    icon={Check} 
                    color="border-green-500" 
                  />
                </div>
                <div className="stagger-item animate-staggered">
                  <StatCard 
                    title="Units Needed (Eligible)" 
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
                  Eligible for me
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
                        id={request.id}
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
            </>
          )}
        </div>
    </div>
    </>
  );
}
