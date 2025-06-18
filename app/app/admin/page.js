'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [camps, setCamps] = useState([])
  const [assignedCity, setAssignedCity] = useState('')
  const [stats, setStats] = useState({
    totalRequests: 0,
    currentRequests: 0,
    ongoingRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    totalDonors: 0,
    upcomingCamps: 0,
    ongoingCamps: 0,
    completedCamps: 0
  })
  const [activeTab, setActiveTab] = useState('requests')
  const [activeRequestFilter, setActiveRequestFilter] = useState('received')
  const [activeCampFilter, setActiveCampFilter] = useState('all')
  const [activeBloodGroupFilter, setActiveBloodGroupFilter] = useState('all')
  const [activeGenderFilter, setActiveGenderFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [donorStats, setDonorStats] = useState({
    byBloodGroup: {},
    availableDonors: 0,
    unavailableDonors: 0
  })
  const [activeDonorStatusFilter, setActiveDonorStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('request')
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: '',
    requestId: null,
    message: ''
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionId, setActionId] = useState('')
  const [actionType, setActionType] = useState('')
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [emergencyLevel, setEmergencyLevel] = useState('')
  const [isDonorsModalOpen, setIsDonorsModalOpen] = useState(false)
  // Cancelled donors modal state
  const [isCancelledModalOpen, setIsCancelledModalOpen] = useState(false)
  const [loadingCancelled, setLoadingCancelled] = useState(false)
  const [requestCancellations, setRequestCancellations] = useState([])
  const [selectedRequestDonors, setSelectedRequestDonors] = useState([])
  const [loadingDonors, setLoadingDonors] = useState(false)
  const [requestsWithDonations, setRequestsWithDonations] = useState([])
  const [buttonLoadingId, setButtonLoadingId] = useState(null)

  // Before any useEffect calls, update the fetchRequests function to use useCallback
  // Define fetchRequests with useCallback
  const fetchRequests = useCallback(async () => {
    try {
      const requestsRef = collection(db, 'requests');
      let requestQuery;
      
      if (userRole === 'admin' && assignedCity) {
        requestQuery = query(requestsRef, where('City', '==', assignedCity));
      } else {
        requestQuery = query(requestsRef);
      }
      
      const requestsSnapshot = await getDocs(requestQuery);
      const requestsData = [];
      const requestsWithInitiatedDonations = [];
      
      // Process each request to check for donations
      for (const requestDoc of requestsSnapshot.docs) {
        const requestData = { id: requestDoc.id, ...requestDoc.data() };
        
        // Check for donations
        const donationsRef = collection(db, "requests", requestDoc.id, "donations");
        const donationsSnapshot = await getDocs(donationsRef);
        
        // If donations exist, add to our tracking array
        if (!donationsSnapshot.empty) {
          requestsWithInitiatedDonations.push(requestDoc.id);
          // You could also add a hasDonations field to the request data if needed
          requestData.hasDonations = true;
        }
        
        requestsData.push(requestData);
      }
      
      setRequests(requestsData);
      setRequestsWithDonations(requestsWithInitiatedDonations);
    } catch (error) {
      console.error("Error fetching requests: ", error);
    }
  }, [db, userRole, assignedCity]);

  // Check user authorization
  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    const checkUserRole = async () => {
      setLoading(true)
      try {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          // Get user role
          setUserRole(userData.role)
          
          // Get assigned city for admin
          if (userData.role === 'admin') {
            setAssignedCity(userData.assignedCity || '')
          }
          
          // Only allow admin or superadmin to access dashboard
          if (userData.role !== 'admin' && userData.role !== 'superadmin') {
            router.replace('/')
            return
          }
        } else {
          // No user document found, redirect
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        router.replace('/')
        return
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [user, router])

  // Fetch donors when user is authorized or assignedCity changes
  useEffect(() => {
    const fetchDonors = async () => {
      if (!user || !userRole) {
        return;
      }

      // Only fetch if user has proper permissions
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        return;
      }
      
      try {
        console.log(`Fetching donors with role: ${userRole}, city: ${assignedCity || 'none'}`);
        
        const donorsCollection = collection(db, 'donors');
        let donorQuery;
        
        // Strict filtering for admin users
        if (userRole === 'admin' && assignedCity) {
          // Make sure to filter for exact city match
          donorQuery = query(donorsCollection, where('ResidentCity', '==', assignedCity));
          console.log(`Filtering donors for city: ${assignedCity}`);
        } else {
          // For superadmin, no filtering
          donorQuery = donorsCollection;
          console.log('No city filtering (superadmin)');
        }
        
        const donorSnapshot = await getDocs(donorQuery);
        const donorList = donorSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Total donors fetched: ${donorList.length}`);
        
        // Calculate statistics for donors
        const stats = {
          byBloodGroup: {},
          availableDonors: 0,
          unavailableDonors: 0
        };
        
        // Initialize blood group counters
        ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].forEach(bg => {
          stats.byBloodGroup[bg] = {
            total: 0,
            available: 0,
            unavailable: 0
          };
        });
        
        // Count donors by blood group and availability
        donorList.forEach(donor => {
          if (donor.BloodGroup) {
            // Increment total count for this blood group
            if (!stats.byBloodGroup[donor.BloodGroup]) {
              stats.byBloodGroup[donor.BloodGroup] = { total: 0, available: 0, unavailable: 0 };
            }
            stats.byBloodGroup[donor.BloodGroup].total++;
            
            // Determine if donor is available
            const lastDonation = donor.lastDonationDate && donor.lastDonationDate.toDate
              ? donor.lastDonationDate.toDate()
              : donor.lastDonationDate
              ? new Date(donor.lastDonationDate)
              : null
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            if (!lastDonation || lastDonation < ninetyDaysAgo) {
              stats.byBloodGroup[donor.BloodGroup].available++;
              stats.availableDonors++;
            } else {
              stats.byBloodGroup[donor.BloodGroup].unavailable++;
              stats.unavailableDonors++;
            }
          }
        });
        
        setDonorStats(stats);
        setDonors(donorList);
      } catch (error) {
        console.error("Error fetching donors:", error);
        toast.error("Failed to load donors");
      }
    };

    fetchDonors();
  }, [user, userRole, assignedCity, db])

  // Separate useEffect for fetching requests based on userRole and assignedCity
  useEffect(() => {
    if (!user) return;
    
    if (userRole === 'admin' || userRole === 'superadmin') {
      fetchRequests();
    }
  }, [userRole, assignedCity, fetchRequests]);

  // Fetch camps in real time  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'camps'), (snapshot) => {
      const now = new Date()
      const campsList = snapshot.docs.map(doc => {
        const data = doc.data()
        const campStart = new Date(data.CampStart)
        const campEnd = new Date(data.CampEnd)
        let computedStatus = ''
        if (campStart > now) {
          computedStatus = 'upcoming'
        } else if (campStart <= now && campEnd >= now) {
          computedStatus = 'ongoing'
        } else {
          computedStatus = 'completed'
        }
        return { id: doc.id, ...data, CampStatus: computedStatus }
      })
      setCamps(campsList)
      setStats(prev => ({
        ...prev,
        upcomingCamps: campsList.filter(camp => camp.CampStatus === "upcoming").length,
        ongoingCamps: campsList.filter(camp => camp.CampStatus === "ongoing").length,
        completedCamps: campsList.filter(camp => camp.CampStatus === "completed").length
      }))
    })
    return () => unsubscribe()
  }, [])

  // Update request status function with confirmation
  const updateRequestStatus = async (id, status, emergencyLevel = null) => {
    try {
      const requestRef = doc(db, 'requests', id)
      const updateData = {
        Verified: status
      }
      
      // Add emergency level if provided
      if (emergencyLevel) {
        updateData.EmergencyLevel = emergencyLevel
      }
      
      await updateDoc(requestRef, updateData)
      toast.success(`Request ${status} successfully`)
      fetchRequests()
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Failed to update request')
    }
  }

  // Opens the confirmation modal for any action
  const handleConfirmAction = (id, action) => {
    setActionId(id)
    setActionType(action)
    
    if (action === 'accepted') {
      setEmergencyLevel('') // Reset emergency level
      setShowEmergencyDialog(true)
    } else {
      setShowConfirmDialog(true)
    }
  }

  // Open cancelled donors modal for a request
  const openCancelledModal = async (requestId) => {
    try {
      setLoadingCancelled(true);
      const cancellationsRef = collection(db, 'requests', requestId, 'cancellations');
      const snapshot = await getDocs(cancellationsRef);
      const cancellations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequestCancellations(cancellations);
    } catch (error) {
      console.error('Error fetching cancellations:', error);
      toast.error('Failed to load cancellations');
    } finally {
      setLoadingCancelled(false);
      setIsCancelledModalOpen(true);
    }
  }

  // Open details modal for an item
  const openDetailsModal = (item, type) => {
    setSelectedItem(item)
    setModalType(type)
    setIsModalOpen(true)
  }

  // Handle sidebar clicks (mobile and desktop)
  const handleSidebarClick = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    // Reset sub-filters when switching tabs
    if (tab === 'requests') {
      setActiveRequestFilter('received')
    } else if (tab === 'camps') {
      setActiveCampFilter('all')
    } else if (tab === 'donors') {
      setActiveBloodGroupFilter('all')
      setActiveGenderFilter('all')
      setSearchQuery('') // Reset search query
    }
    setIsSidebarOpen(false)
  }

  // Filter data based on active tab and sub-tab selections
  let filteredData = []
  if (activeTab === 'requests') {
    filteredData = activeRequestFilter === 'all'
      ? requests
      : requests.filter(req => req.Verified === activeRequestFilter)
  } else if (activeTab === 'camps') {
    filteredData = activeCampFilter === 'all'
      ? camps
      : camps.filter(camp => camp.CampStatus === activeCampFilter)
  } else if (activeTab === 'donors') {
    // Apply multiple filters on donors
    filteredData = donors.filter(donor => {
      // Filter by availability status
      if (activeDonorStatusFilter !== 'all') {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const lastDonationDate = donor.lastDonationDate && donor.lastDonationDate.toDate
          ? donor.lastDonationDate.toDate()
          : donor.lastDonationDate
          ? new Date(donor.lastDonationDate)
          : null
        const isAvailable = !lastDonationDate || lastDonationDate < ninetyDaysAgo

        if (activeDonorStatusFilter === 'available' && !isAvailable) {
          return false
        }
        if (activeDonorStatusFilter === 'unavailable' && isAvailable) {
          return false
        }
      }
      // First apply search query filter (case-insensitive)
      if (searchQuery && donor.Name && !donor.Name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by blood group
      if (activeBloodGroupFilter !== 'all' && donor.BloodGroup !== activeBloodGroupFilter) {
        return false;
      }
      
      // Filter by gender (case-insensitive comparison)
      if (activeGenderFilter !== 'all' && 
          (!donor.Gender || donor.Gender.toLowerCase() !== activeGenderFilter.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not admin or superadmin, show unauthorized message
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin dashboard. 
            You will be redirected to the home page.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  // Add a new function to handle setting emergency and then accepting
  const handleAcceptWithEmergency = () => {
    if (!emergencyLevel) {
      toast.error('Please select an emergency level before accepting')
      return
    }
    
    updateRequestStatus(actionId, 'accepted', emergencyLevel)
    setShowEmergencyDialog(false)
  }

  const handleConfirm = () => {
    if (actionType) {
      updateRequestStatus(actionId, actionType);
      setShowConfirmDialog(false);
    }
  };

  // Add a function to open the donors modal
  const openDonorsModal = async (requestId) => {
    setLoadingDonors(true)
    try {
      // Fetch all donations for this request
      const donationsRef = collection(db, "requests", requestId, "donations")
      const donationsSnapshot = await getDocs(donationsRef)
      
      if (donationsSnapshot.empty) {
        setSelectedRequestDonors([])
        setIsDonorsModalOpen(true)
        return
      }
      
      // Get donation data and fetch donor details for each donation
      const donationsData = []
      for (const donationDoc of donationsSnapshot.docs) {
        const donation = { id: donationDoc.id, ...donationDoc.data() }
        
        // Get donor details if available
        if (donation.donorEmail) {
          const donorQuery = query(collection(db, "donors"), where("Email", "==", donation.donorEmail))
          const donorSnapshot = await getDocs(donorQuery)
          if (!donorSnapshot.empty) {
            donation.donorDetails = donorSnapshot.docs[0].data()
          }
        } else if (donation.donorId) {
          // Try to get donor email from users collection
          const userDoc = await getDoc(doc(db, "users", donation.donorId))
          if (userDoc.exists() && userDoc.data().email) {
            const donorEmail = userDoc.data().email
            const donorQuery = query(collection(db, "donors"), where("Email", "==", donorEmail))
            const donorSnapshot = await getDocs(donorQuery)
            if (!donorSnapshot.empty) {
              donation.donorDetails = donorSnapshot.docs[0].data()
            }
          }
        }
        
        donationsData.push(donation)
      }
      
      setSelectedRequestDonors(donationsData)
      setIsDonorsModalOpen(true)
    } catch (error) {
      console.error("Error fetching donations:", error)
      toast.error("Failed to load donor information")
    } finally {
      setLoadingDonors(false)
      setButtonLoadingId(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-blue-900 to-gray-800 text-white p-6 space-y-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h2>
          <p className="text-sm opacity-70">Manage your operations</p>
          {assignedCity && (
            <div className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full inline-block">
              {assignedCity} City Admin
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-4">
          <button
            onClick={() => handleSidebarClick('requests')}
            className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
              activeTab === 'requests' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            Blood Requests
          </button>
          <button
            onClick={() => handleSidebarClick('camps')}
            className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
              activeTab === 'camps' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            Blood Camps
          </button>
          <button
            onClick={() => handleSidebarClick('donors')}
            className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
              activeTab === 'donors' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            Donors
          </button>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DialogContent className="w-72 bg-gradient-to-b from-blue-900 to-gray-800 text-white p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold">Admin Dashboard</h2>
            <p className="text-sm opacity-70">Manage your operations</p>
          </div>
          <nav className="space-y-4">
            <Link href="#" onClick={() => handleSidebarClick('requests')} className="block px-4 py-2 rounded hover:bg-red-500">
              Blood Requests
            </Link>
            <Link href="#" onClick={() => handleSidebarClick('camps')} className="block px-4 py-2 rounded hover:bg-red-500">
              Blood Camps
            </Link>
            <Link href="#" onClick={() => handleSidebarClick('donors')} className="block px-4 py-2 rounded hover:bg-red-500">
              Donors
            </Link>
          </nav>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">
            {activeTab === 'requests'
              ? 'Blood Requests'
              : activeTab === 'camps'
              ? 'Blood Camps'
              : 'Donors'}
          </h1>
          {assignedCity && (
            <div className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Managing {assignedCity}
            </div>
          )}
          <button className="md:hidden p-2 rounded bg-gray-200 hover:bg-gray-300 transition" onClick={() => setIsSidebarOpen(true)}>
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>

        {/* Sub-tabs for Requests */}
        {activeTab === 'requests' && (
          <div className="mb-4 flex space-x-4">
            {[
              { label: 'Current', value: 'received' },
              { label: 'Ongoing', value: 'accepted' },
              { label: 'Completed', value: 'completed' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'All', value: 'all' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setActiveRequestFilter(tab.value); setCurrentPage(1) }}
                className={`px-4 py-2 rounded ${
                  activeRequestFilter === tab.value ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Sub-tabs for Camps */}
        {activeTab === 'camps' && (
          <div className="mb-4 flex space-x-4">
            {[
              { label: 'All Camps', value: 'all' },
              { label: 'Upcoming', value: 'upcoming' },
              { label: 'Ongoing', value: 'ongoing' },
              { label: 'Completed', value: 'completed' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setActiveCampFilter(tab.value); setCurrentPage(1) }}
                className={`px-4 py-2 rounded ${
                  activeCampFilter === tab.value ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Blood Group Filter for Donors */}
        {activeTab === 'donors' && (
          <>
            {/* Donor Statistics Cards - MOVED ABOVE FILTERS */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Donor Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                  className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${
                    activeDonorStatusFilter === 'all'
                      ? 'ring-2 ring-red-500'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setActiveDonorStatusFilter('all')}
                >
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Total Donors</h4>
                  <p className="text-3xl font-bold text-red-600">{donors.length}</p>
                </div>
                <div
                  className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${
                    activeDonorStatusFilter === 'available'
                      ? 'ring-2 ring-green-500'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setActiveDonorStatusFilter('available')}
                >
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Available Donors</h4>
                  <p className="text-3xl font-bold text-green-600">{donorStats.availableDonors}</p>
                  <p className="text-sm text-gray-500">Eligible to donate now</p>
                </div>
                <div
                  className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${
                    activeDonorStatusFilter === 'unavailable'
                      ? 'ring-2 ring-orange-500'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setActiveDonorStatusFilter('unavailable')}
                >
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Unavailable Donors</h4>
                  <p className="text-3xl font-bold text-orange-500">{donorStats.unavailableDonors}</p>
                  <p className="text-sm text-gray-500">Recently donated (within 90 days)</p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-4">Blood Group Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(donorStats.byBloodGroup).map(([bloodGroup, stats]) => (
                  stats.total > 0 && (
                    <div key={bloodGroup} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xl font-bold text-red-600">{bloodGroup}</h4>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {stats.total} donors
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium text-green-600">{stats.available}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unavailable:</span>
                          <span className="font-medium text-orange-500">{stats.unavailable}</span>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Donor Filters</h3>
                <button
                  onClick={() => {
                    setActiveBloodGroupFilter('all');
                    setActiveGenderFilter('all');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Search Donors</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Filter by Gender</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' }
                    ].map(gender => (
                      <button
                        key={gender.value}
                        onClick={() => { setActiveGenderFilter(gender.value); setCurrentPage(1) }}
                        className={`px-4 py-2 rounded ${
                          activeGenderFilter === gender.value ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {gender.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Filter by Blood Group</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'A+', value: 'A+' },
                      { label: 'A-', value: 'A-' },
                      { label: 'B+', value: 'B+' },
                      { label: 'B-', value: 'B-' },
                      { label: 'AB+', value: 'AB+' },
                      { label: 'AB-', value: 'AB-' },
                      { label: 'O+', value: 'O+' },
                      { label: 'O-', value: 'O-' }
                    ].map(group => (
                      <button
                        key={group.value}
                        onClick={() => { setActiveBloodGroupFilter(group.value); setCurrentPage(1) }}
                        className={`px-4 py-2 rounded ${
                          activeBloodGroupFilter === group.value ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Data Table Section */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 font-semibold">Patient Name</th>
                    <th className="px-6 py-3 font-semibold">Blood Group</th>
                    <th className="px-6 py-3 font-semibold">Hospital</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(request => (
                    <tr key={request.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{request.PatientName}</td>
                      <td className="px-6 py-4">{request.BloodGroup}</td>
                      <td className="px-6 py-4">{request.Hospital}</td>
                      <td className="px-6 py-4 space-x-2">
                        {request.Verified === "received" && (
                          <>
                            <Button onClick={() => handleConfirmAction(request.id, 'accepted')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">
                              Accept
                            </Button>
                            <Button onClick={() => handleConfirmAction(request.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition">
                              Reject
                            </Button>
                          </>
                        )}
                        <Button onClick={() => openDetailsModal(request, 'request')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                          More
                        </Button>
                        {(request.Verified === "accepted" || request.Verified === "completed") && (
                          <Button 
                            onClick={() => {
                              if (buttonLoadingId === request.id) return;
                              setButtonLoadingId(request.id);
                              openDonorsModal(request.id);
                            }}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
                            disabled={buttonLoadingId === request.id}
                          >
                            {buttonLoadingId === request.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Loading
                              </div>
                            ) : (
                              "View Donors"
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={() => openCancelledModal(request.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                        >
                          Cancelled
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 font-semibold">Profile</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Blood Group</th>
                    <th className="px-6 py-3 font-semibold">Mobile</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(donor => (
                    <tr key={donor.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        {donor.profile_picture ? (
                          <Image 
                            src={donor.profile_picture} 
                            alt={donor.Name} 
                            width={40} 
                            height={40} 
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 font-semibold text-sm">
                              {donor.Name && donor.Name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{donor.Name}</td>
                      <td className="px-6 py-4">{donor.BloodGroup}</td>
                      <td className="px-6 py-4">{donor.MobileNumber}</td>
                      <td className="px-6 py-4">
                        <Button onClick={() => openDetailsModal(donor, 'donor')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                          More
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'camps' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 font-semibold">Camp Name</th>
                    <th className="px-6 py-3 font-semibold">Date Range</th>
                    <th className="px-6 py-3 font-semibold">Location</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(camp => (
                    <tr key={camp.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{camp.CampName}</td>
                      <td className="px-6 py-4">
                        {new Date(camp.CampStart).toLocaleString()} - {new Date(camp.CampEnd).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">{camp.CampLocation}</td>
                      <td className="px-6 py-4 capitalize">{camp.CampStatus}</td>
                      <td className="px-6 py-4">
                        <Button onClick={() => openDetailsModal(camp, 'camp')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                          More
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {(
          <div className="flex justify-center mt-8">
            <div className="space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
                disabled={currentItems.length < itemsPerPage}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
              <span className="px-4 py-2">
                Page {currentPage} • {filteredData.length} {activeTab === 'requests' ? 'Requests' : 
                  activeTab === 'donors' ? 'Donors' : 'Camps'}
              </span>
            </div>
          </div>
        )}

        {/* Original Confirm Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {actionType === 'accepted'
                  ? 'Confirm Accept'
                  : actionType === 'rejected'
                  ? 'Confirm Reject'
                  : 'Confirm Complete'}
              </DialogTitle>
            </DialogHeader>
            <p>{confirmModal.message}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Emergency Level Dialog */}
        <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
          <DialogContent className="bg-white rounded-lg shadow-xl max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">Select Emergency Level</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <p className="text-gray-600 mb-6">Please select the emergency level for this request before accepting:</p>
              
              <div className="space-y-4 mb-6">
                <div 
                  className={`p-4 rounded-lg cursor-pointer border-2 ${emergencyLevel === 'high' ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                  onClick={() => setEmergencyLevel('high')}
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-600 mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-800">High Emergency</p>
                      <p className="text-sm text-gray-600">Critical condition, urgent attention needed</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg cursor-pointer border-2 ${emergencyLevel === 'medium' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                  onClick={() => setEmergencyLevel('medium')}
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-orange-500 mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Medium Emergency</p>
                      <p className="text-sm text-gray-600">Requires prompt attention</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg cursor-pointer border-2 ${emergencyLevel === 'low' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'}`}
                  onClick={() => setEmergencyLevel('low')}
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Low Emergency</p>
                      <p className="text-sm text-gray-600">Standard procedure, not time-critical</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEmergencyDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!emergencyLevel) {
                      toast.error('Please select an emergency level');
                      return;
                    }
                    updateRequestStatus(actionId, 'accepted', emergencyLevel);
                    setShowEmergencyDialog(false);
                  }}
                  disabled={!emergencyLevel}
                >
                  Accept Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {modalType === 'request' ? 'Request Details' : 
                 modalType === 'donor' ? 'Donor Details' : 'Camp Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6">
              {selectedItem && (
                <div className="space-y-4 mt-4">
                  {modalType === 'request' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Attender Mobile</p>
                        <p>{selectedItem.AttenderMobile}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Attender Name</p>
                        <p>{selectedItem.AttenderName}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Blood Group</p>
                        <p>{selectedItem.BloodGroup}</p>
                      </div>
                      <div>
                        <p className="font-semibold">City</p>
                        <p>{selectedItem.City}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Country</p>
                        <p>{selectedItem.Country}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Gender</p>
                        <p>{selectedItem.Gender}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Hospital</p>
                        <p>{selectedItem.Hospital}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Patient Age</p>
                        <p>{selectedItem.PatientAge}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Patient Name</p>
                        <p>{selectedItem.PatientName}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Reason</p>
                        <p>{selectedItem.Reason}</p>
                      </div>
                      <div>
                        <p className="font-semibold">State</p>
                        <p>{selectedItem.State}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Units Needed</p>
                        <p>{selectedItem.UnitsNeeded}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Units Donated</p>
                        <p>{selectedItem.UnitsDonated || 0}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Verified</p>
                        <p>{selectedItem.Verified}</p>
                      </div>
                      {selectedItem.EmergencyLevel && (
                        <div>
                          <p className="font-semibold">Emergency Level</p>
                          <p className="capitalize">{selectedItem.EmergencyLevel}</p>
                        </div>
                      )}
                    </div>
                  ) : modalType === 'donor' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 flex justify-center mb-4">
                        {selectedItem.profile_picture ? (
                          <Image 
                            src={selectedItem.profile_picture} 
                            alt={selectedItem.Name} 
                            width={100} 
                            height={100} 
                            className="rounded-full object-cover border-4 border-red-100"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 font-bold text-2xl">
                              {selectedItem.Name && selectedItem.Name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Name</p>
                        <p>{selectedItem.Name}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Blood Group</p>
                        <p>{selectedItem.BloodGroup}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Email</p>
                        <p>{selectedItem.Email}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Mobile</p>
                        <p>{selectedItem.MobileNumber}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Permanent City</p>
                        <p className="text-gray-700">{selectedItem.PermanentCity || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Residential City</p>
                        <p className="text-gray-700">{selectedItem.ResidentCity || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">State</p>
                        <p>{selectedItem.State}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Whatsapp Number</p>
                        <p>{selectedItem.WhatsappNumber}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Last Donation Date</p>
                        <p>
                          {selectedItem.lastDonationDate
                            ? new Date(
                                selectedItem.lastDonationDate.toDate
                                  ? selectedItem.lastDonationDate.toDate()
                                  : selectedItem.lastDonationDate
                              ).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Camp Name</p>
                        <p>{selectedItem.CampName}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Camp Start</p>
                        <p>{new Date(selectedItem.CampStart).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Camp End</p>
                        <p>{new Date(selectedItem.CampEnd).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Location</p>
                        <p>{selectedItem.CampLocation}</p>
                      </div>
                      <div>
                        <p className="font-semibold">City</p>
                        <p>{selectedItem.CampCity}</p>
                      </div>
                      <div>
                        <p className="font-semibold">State</p>
                        <p>{selectedItem.CampState}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Country</p>
                        <p>{selectedItem.CampCountry}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Target Units</p>
                        <p>{selectedItem.TargetBloodUnits}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Alternative Contact</p>
                        <p>{selectedItem.AlternativeContact}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Description</p>
                        <p>{selectedItem.CampDescription}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Status</p>
                        <p className="capitalize">{selectedItem.CampStatus}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add new Donors Modal */}
        <Dialog open={isDonorsModalOpen} onOpenChange={setIsDonorsModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Donor Information</DialogTitle>
            </DialogHeader>
            {loadingDonors ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedRequestDonors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No donations found for this request.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">Note:</span> Showing {selectedRequestDonors.length} donation record(s).
                  </p>
                </div>
                
                {selectedRequestDonors.map((donation, index) => (
                  <div key={donation.id} className="border rounded-lg overflow-hidden">
                    <div className={`p-4 ${donation.donorOtpVerified ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">
                          Donor #{index + 1}: {donation.donorDetails?.Name || donation.donorName || 'Unknown'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          donation.donorOtpVerified 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {donation.donorOtpVerified ? 'Donation Complete' : 'Donation Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3">
                        {donation.donorDetails && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Blood Group</p>
                              <p className="font-medium">{donation.donorDetails.BloodGroup}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Age</p>
                              <p className="font-medium">{donation.donorDetails.Age}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Gender</p>
                              <p className="font-medium capitalize">{donation.donorDetails.Gender}</p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{donation.donorEmail || 'Not available'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{donation.donorDetails?.MobileNumber || 'Not available'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Donation Date</p>
                          <p className="font-medium">
                            {donation.timestamp ? new Date(donation.timestamp.toDate ? donation.timestamp.toDate() : donation.timestamp).toLocaleString() : 'Not recorded'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">OTP Status</p>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              donation.requesterOtpVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              Requester: {donation.requesterOtpVerified ? 'Verified' : 'Pending'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              donation.donorOtpVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              Donor: {donation.donorOtpVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
