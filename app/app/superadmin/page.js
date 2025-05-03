'use client'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

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

// Add Tamil Nadu cities list from profile page
const tamilNaduCities = [
  "Ambur", "Arakkonam", "Ariyalur", "Aruppukkottai", "Attur", "Chengalpattu", "Chennai", 
  "Coimbatore", "Cuddalore", "Cumbum", "Dharmapuri", "Dindigul", "Erode", "Gudiyatham", 
  "Hosur", "Kanchipuram", "Karaikudi", "Karur", "Kanyakumari", "Kovilpatti", "Krishnagiri", 
  "Kumbakonam", "Madurai", "Mayiladuthurai", "Mettupalayam", "Nagapattinam", "Namakkal", 
  "Nagercoil", "Neyveli", "Ooty", "Palani", "Paramakudi", "Perambalur", "Pollachi", 
  "Pudukkottai", "Rajapalayam", "Ramanathapuram", "Ranipet", "Salem", "Sivakasi", 
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur", 
  "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  // Collections data
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [camps, setCamps] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [userRoleMap, setUserRoleMap] = useState({})
  const [assignedCity, setAssignedCity] = useState('')
  const [activeBloodGroupFilter, setActiveBloodGroupFilter] = useState('all')
  const [activeGenderFilter, setActiveGenderFilter] = useState('all')
  const [activeCityFilter, setActiveCityFilter] = useState('all')
  const [donorStats, setDonorStats] = useState({
    availableDonors: 0,
    unavailableDonors: 0,
    byBloodGroup: {},
  });
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

  // Main tab (sidebar) state. For superadmins we allow:
  // 'requests', 'camps', 'donors', 'manageAdmins'
  // Sub-tab states (only for requests and camps)
  const [activeRequestFilter, setActiveRequestFilter] = useState('received') // Options: received, accepted, completed, rejected, all
  const [activeCampFilter, setActiveCampFilter] = useState('all') // Options: all, upcoming, ongoing, completed

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal states: for details and confirmations
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionId, setActionId] = useState('')
  const [actionType, setActionType] = useState('')
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Add emergency level state variables
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [emergencyLevel, setEmergencyLevel] = useState('')

  // Search state for Manage Admins
  const [searchQuery, setSearchQuery] = useState('')

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Role Change Confirmation Modal
  const [roleConfirmModal, setRoleConfirmModal] = useState({
    open: false,
    userId: '',
    email: '',
    newRole: '',
    city: ''
  })

  // Add state for selected city
  const [selectedCity, setSelectedCity] = useState('');

  // Add new state variables for editing donor details
  const [isEditing, setIsEditing] = useState(false);
  const [editedDonorData, setEditedDonorData] = useState(null);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);

  // Main tab (sidebar) state (removing commented out code)
  const [activeTab, setActiveTab] = useState('requests')
  
  // Add state for user details modal
  const [userDetailsData, setUserDetailsData] = useState(null)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false)
  const [userDonorData, setUserDonorData] = useState(null)

  // Add a function to open the donors modal
  const [isDonorsModalOpen, setIsDonorsModalOpen] = useState(false)
  const [selectedRequestDonors, setSelectedRequestDonors] = useState([])
  const [loadingDonors, setLoadingDonors] = useState(false)
  const [requestsWithDonations, setRequestsWithDonations] = useState([]) // New state for tracking requests with donations
  const [buttonLoadingId, setButtonLoadingId] = useState(null) // Track which button is loading

  // Check user authorization
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        router.push('/')
        return
      }

      try {
        const userRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(userRef)
        
        if (docSnap.exists()) {
          const userData = docSnap.data()
          setUserRole(userData.role)
          
          // Only allow superadmin role
          if (userData.role !== 'superadmin') {
            router.push('/')
          }
        } else {
          // No user document found, redirect
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [user, router])

  // Only fetch data if user is authorized
  useEffect(() => {
    if (!user || userRole !== 'superadmin') {
      return
    }
    
    // Function to fetch requests with donation info
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, 'requests')
        const requestsSnapshot = await getDocs(requestsRef)
        
        const requestsData = []
        const requestsWithInitiatedDonations = []
        
        // Process each request to check for donations
        for (const requestDoc of requestsSnapshot.docs) {
          const requestData = { id: requestDoc.id, ...requestDoc.data() }
          
          // Check for donations subcollection
          const donationsRef = collection(db, "requests", requestDoc.id, "donations")
          const donationsSnapshot = await getDocs(donationsRef)
          
          // If donations exist, add to our tracking array
          if (!donationsSnapshot.empty) {
            requestsWithInitiatedDonations.push(requestDoc.id)
            // Add a flag to easily check if this request has donations
            requestData.hasDonations = true
          }
          
          requestsData.push(requestData)
        }
        
        setRequests(requestsData)
        setRequestsWithDonations(requestsWithInitiatedDonations)
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalRequests: requestsData.length,
          currentRequests: requestsData.filter(r => r.Verified === 'received').length,
          ongoingRequests: requestsData.filter(r => r.Verified === 'accepted').length,
          completedRequests: requestsData.filter(r => r.Verified === 'completed').length,
          rejectedRequests: requestsData.filter(r => r.Verified === 'rejected').length
        }))
      } catch (error) {
        console.error("Error fetching requests:", error)
      }
    }
    
    fetchRequests()

    // Listen for donors
    const donorsUnsubscribe = onSnapshot(collection(db, 'donors'), (snapshot) => {
      const donorsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setDonors(donorsList)
      
      // Calculate donor statistics
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      // Initialize blood group stats
      const bloodGroupStats = {};
      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].forEach(group => {
        bloodGroupStats[group] = { total: 0, available: 0, unavailable: 0 };
      });
      
      let availableCount = 0;
      let unavailableCount = 0;
      
      donorsList.forEach(donor => {
        // Count by blood group
        const bloodGroup = donor.BloodGroup;
        if (bloodGroup && bloodGroupStats[bloodGroup]) {
          bloodGroupStats[bloodGroup].total += 1;
          
          // Check availability based on last donation date
          const lastDonationDate = donor.LastDonationDate ? new Date(donor.LastDonationDate) : null;
          
          if (!lastDonationDate || lastDonationDate < threeMonthsAgo) {
            bloodGroupStats[bloodGroup].available += 1;
            availableCount += 1;
          } else {
            bloodGroupStats[bloodGroup].unavailable += 1;
            unavailableCount += 1;
          }
        }
      });
      
      setDonorStats({
        availableDonors: availableCount,
        unavailableDonors: unavailableCount,
        byBloodGroup: bloodGroupStats
      });
    });

    // Listen for camps
    const campsUnsubscribe = onSnapshot(collection(db, 'camps'), (snapshot) => {
      const now = new Date();
      const campsList = snapshot.docs.map(doc => {
        const data = doc.data();
        const campStart = new Date(data.CampStart);
        const campEnd = new Date(data.CampEnd);
        let computedStatus = '';
        
        if (campStart > now) {
          computedStatus = 'upcoming';
        } else if (campStart <= now && campEnd >= now) {
          computedStatus = 'ongoing';
        } else {
          computedStatus = 'completed';
        }
        
        return { id: doc.id, ...data, CampStatus: computedStatus };
      });
      
      setCamps(campsList);
      
      setStats(prev => ({
        ...prev,
        upcomingCamps: campsList.filter(camp => camp.CampStatus === "upcoming").length,
        ongoingCamps: campsList.filter(camp => camp.CampStatus === "ongoing").length,
        completedCamps: campsList.filter(camp => camp.CampStatus === "completed").length
      }));
    });

    // Listen for all users (for Manage Admins and Users sections)
    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersList);
    });

    return () => {
      donorsUnsubscribe();
      campsUnsubscribe();
      usersUnsubscribe();
    }
  }, [user, userRole, db])

  // Update request status function
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
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Failed to update request')
    }
  }

  // Handle confirm action
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

  const handleConfirm = () => {
    if (actionType) {
      updateRequestStatus(actionId, actionType)
      setShowConfirmDialog(false)
    }
  }

  // Open details modal for any item
  const openDetailsModal = (item, type) => {
    setSelectedItem(item)
    setModalType(type)
    setIsModalOpen(true)
    if (type === 'donor') {
      setEditedDonorData(item)
      setSameAsPermanent(item.PermanentCity === item.ResidentCity)
    }
  }

  // Sidebar click handler (desktop and mobile)
  const handleSidebarClick = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSearchQuery('')
    
    // Reset sub-filters when switching tabs
    if (tab === 'requests') {
      setActiveRequestFilter('received')
    } else if (tab === 'camps') {
      setActiveCampFilter('all')
    } else if (tab === 'donors') {
      setActiveBloodGroupFilter('all')
      setActiveGenderFilter('all')
      setActiveCityFilter('all')
    }
    setIsSidebarOpen(false)
  }

  // Update a user's role and assigned city (for Manage Admins)
  const handleSetRole = async (uid, email, role, city = null) => {
    try {
      const updateData = { role };
      
      // Only include city for admins
      if (role === 'admin' && city) {
        updateData.assignedCity = city;
      } else if (role !== 'admin') {
        // Remove assignedCity if user is not an admin
        updateData.assignedCity = null;
      }
      
      await updateDoc(doc(db, 'users', uid), updateData);
      toast.success(`User ${email} is now ${role}${role === 'admin' && city ? ` for ${city}` : ''}`);
    } catch (error) {
      console.error("Error setting role:", error);
      toast.error("Failed to set role");
    }
  }

  // Open role-change confirmation modal - update to include city
  const handleRoleChangeClick = (uid, email, role) => {
    setSelectedCity(''); // Reset selected city
    
    setRoleConfirmModal({
      open: true,
      userId: uid,
      email,
      newRole: role,
      city: ''
    });
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
      
      // Filter by city
      if (activeCityFilter !== 'all' && donor.ResidentCity !== activeCityFilter) {
        return false;
      }
      
      return true;
    });
  } else if (activeTab === 'users') {
    // Make sure we have allUsers data before filtering
    filteredData = allUsers && allUsers.length > 0
      ? allUsers.filter(u => !searchQuery || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())))
      : []
  } else if (activeTab === 'manageAdmins') {
    // Make sure we have allUsers data before filtering
    filteredData = allUsers && allUsers.length > 0
      ? allUsers.filter(u => !searchQuery || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())))
      : []
  }
  
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  // Filter users for Manage Admins based on search query
  const filteredUsers = allUsers && allUsers.length > 0
    ? allUsers.filter(u => !searchQuery || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())))
    : []

  // Add function to handle donor data changes
  const handleDonorChange = (field, value) => {
    setEditedDonorData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'PermanentCity' && sameAsPermanent) {
        newData.ResidentCity = value;
      }
      return newData;
    });
  };

  // Add function to save donor changes
  const handleSaveDonorChanges = async () => {
    try {
      const donorRef = doc(db, 'donors', selectedItem.id);
      await updateDoc(donorRef, editedDonorData);
      toast.success('Donor details updated successfully!');
      setIsEditing(false);
      // Update the selected item with new data
      setSelectedItem(editedDonorData);
    } catch (error) {
      console.error('Error updating donor:', error);
      toast.error('Failed to update donor details');
    }
  };

  // Add function to fetch donor data for a user by email
  const fetchUserDonorData = async (email) => {
    try {
      // Query the donors collection for a document with matching email
      const donorsRef = collection(db, 'donors')
      const q = query(donorsRef, where("Email", "==", email))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Return the first matching donor record
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching donor data:', error)
      return null
    }
  }
  
  // Add function to open user details modal
  const openUserDetailsModal = async (userData) => {
    setUserDetailsData(userData)
    
    // Check if user has donor data
    if (userData.email) {
      const donorData = await fetchUserDonorData(userData.email)
      setUserDonorData(donorData)
    } else {
      setUserDonorData(null)
    }
    
    setIsUserDetailsModalOpen(true)
  }

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
      for (const doc of donationsSnapshot.docs) {
        const donation = { id: doc.id, ...doc.data() }
        
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

  // If loading, show a loading indicator
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </>
    )
  }

  // If not authorized, show error message
  if (!userRole || userRole !== 'superadmin') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-8">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-blue-900 to-gray-800 text-white p-6 space-y-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">SuperAdmin Dashboard</h2>
          <p className="text-sm opacity-70">Manage everything</p>
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
          <button
            onClick={() => handleSidebarClick('users')}
            className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
              activeTab === 'users' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => handleSidebarClick('manageAdmins')}
            className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
              activeTab === 'manageAdmins' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            Manage Admins
          </button>
        </nav>
      </aside>

      {/* Mobile Sidebar - Update to include Users */}
      <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DialogContent className="w-72 bg-gradient-to-b from-blue-900 to-gray-800 text-white p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold">SuperAdmin Dashboard</h2>
            <p className="text-sm opacity-70">Manage everything</p>
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
            <Link href="#" onClick={() => handleSidebarClick('users')} className="block px-4 py-2 rounded hover:bg-red-500">
              Users
            </Link>
            <Link href="#" onClick={() => handleSidebarClick('manageAdmins')} className="block px-4 py-2 rounded hover:bg-red-500">
              Manage Admins
            </Link>
          </nav>
        </DialogContent>
      </Dialog>

      {/* Main Content - Update title to include Users */}
      <div className="flex-1 p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">
            {activeTab === 'requests'
              ? 'Blood Requests'
              : activeTab === 'camps'
              ? 'Blood Camps'
              : activeTab === 'donors'
              ? 'Donors'
              : activeTab === 'users'
              ? 'All Users'
              : 'Manage Admins'}
          </h1>
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
                        <div className="text-right">
                          {/* Show View Donors button only for accepted or completed requests */}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <>
            {/* Donor Statistics Cards */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Donor Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Total Donors</h4>
                  <p className="text-3xl font-bold text-red-600">{donors.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Available Donors</h4>
                  <p className="text-3xl font-bold text-green-600">{donorStats.availableDonors}</p>
                  <p className="text-sm text-gray-500">Eligible to donate now</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Unavailable Donors</h4>
                  <p className="text-3xl font-bold text-orange-500">{donorStats.unavailableDonors}</p>
                  <p className="text-sm text-gray-500">Recently donated (within 3 months)</p>
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

            {/* Donor Filters */}
            <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Donor Filters</h3>
                <button
                  onClick={() => {
                    setActiveBloodGroupFilter('all');
                    setActiveGenderFilter('all');
                    setActiveCityFilter('all');
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
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Filter by City</h3>
                  <Select
                    value={activeCityFilter}
                    onValueChange={(value) => {
                      setActiveCityFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {[
                        "Ambur",
                        "Arakkonam",
                        "Ariyalur",
                        "Aruppukkottai",
                        "Attur",
                        "Chengalpattu",
                        "Chennai",
                        "Coimbatore",
                        "Cuddalore",
                        "Cumbum",
                        "Dharmapuri",
                        "Dindigul",
                        "Erode",
                        "Gudiyatham",
                        "Hosur",
                        "Kanchipuram",
                        "Karaikudi",
                        "Karur",
                        "Kanyakumari",
                        "Kovilpatti",
                        "Krishnagiri",
                        "Kumbakonam",
                        "Madurai",
                        "Mayiladuthurai",
                        "Mettupalayam",
                        "Nagapattinam",
                        "Namakkal",
                        "Nagercoil",
                        "Neyveli",
                        "Ooty",
                        "Palani",
                        "Paramakudi",
                        "Perambalur",
                        "Pollachi",
                        "Pudukottai",
                        "Rajapalayam",
                        "Ramanathapuram",
                        "Ranipet",
                        "Salem",
                        "Sivagangai",
                        "Sivakasi",
                        "Tenkasi",
                        "Thanjavur",
                        "Theni",
                        "Thoothukudi",
                        "Tirupattur",
                        "Tiruchendur",
                        "Tiruchirappalli",
                        "Tirunelveli",
                        "Tiruppur",
                        "Tiruvallur",
                        "Tiruvannamalai",
                        "Tiruvarur",
                        "Tuticorin",
                        "Udumalaipettai",
                        "Valparai",
                        "Vandavasi",
                        "Vellore",
                        "Viluppuram",
                        "Virudhunagar"
                      ].map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Active filter summary */}
              {(activeBloodGroupFilter !== 'all' || activeGenderFilter !== 'all' || activeCityFilter !== 'all' || searchQuery) && (
                <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Active Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {activeBloodGroupFilter !== 'all' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Blood Group: {activeBloodGroupFilter}
                      </span>
                    )}
                    {activeGenderFilter !== 'all' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Gender: {activeGenderFilter}
                      </span>
                    )}
                    {activeCityFilter !== 'all' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        City: {activeCityFilter}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

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
          </>
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

        {/* New Users Section */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold">Created On</th>
                    <th className="px-6 py-3 font-semibold">Is Donor</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map(user => {
                      // Check if user has donor data (based on existence in donors state)
                      const isDonor = donors.some(donor => donor.Email === user.email);
                      
                      return (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">{user.role || 'user'}</td>
                          <td className="px-6 py-4">
                            {user.createdAt ? 
                              (typeof user.createdAt.toDate === 'function' ? 
                                new Date(user.createdAt.toDate()).toLocaleDateString() : 
                                new Date(user.createdAt).toLocaleDateString()
                              ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {isDonor ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                Yes
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              onClick={() => openUserDetailsModal(user)}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Update Manage Admins section to include Details button */}
        {activeTab === 'manageAdmins' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Current Role</th>
                    <th className="px-6 py-3 font-semibold">Assigned City</th>
                    <th className="px-6 py-3 font-semibold">Details</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.role || 'user'}</td>
                        <td className="px-6 py-4">{user.role === 'admin' ? (user.assignedCity || 'None assigned') : '-'}</td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => openUserDetailsModal(user)}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            View Details
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {['user', 'admin', 'superadmin']
                              .filter(role => role !== (user.role || 'user'))
                              .map(role => (
                                <Button
                                  key={role}
                                  onClick={() => handleRoleChangeClick(user.id, user.email, role)}
                                >
                                  {`Make ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                                </Button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination (not needed for Manage Admins) */}
        {activeTab !== 'manageAdmins' && (
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
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
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
            <p>Are you sure you want to {actionType} this request?</p>
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
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Emergency Level</h2>
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

        {/* Role Change Confirmation Modal - Update to include city selection for admins */}
        <Dialog open={roleConfirmModal.open} onOpenChange={(open) => setRoleConfirmModal({ ...roleConfirmModal, open })}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Confirm Role Change</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to change the role of {roleConfirmModal.email} to {roleConfirmModal.newRole}?
            </p>
            
            {/* Add city selection for admin role */}
            {roleConfirmModal.newRole === 'admin' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign City
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {tamilNaduCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedCity && (
                  <p className="text-sm text-red-500 mt-1">
                    Please select a city for admin
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRoleConfirmModal({ ...roleConfirmModal, open: false })}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (roleConfirmModal.newRole === 'admin' && !selectedCity) {
                    toast.error('Please select a city for admin');
                    return;
                  }
                  handleSetRole(roleConfirmModal.userId, roleConfirmModal.email, roleConfirmModal.newRole, selectedCity);
                  setRoleConfirmModal({ ...roleConfirmModal, open: false });
                }}
                disabled={roleConfirmModal.newRole === 'admin' && !selectedCity}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setSelectedItem(null) }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {modalType === 'request' ? 'Request Details' : 
                 modalType === 'donor' ? 'Donor Details' : 
                 modalType === 'camp' ? 'Camp Details' : 'User Details'}
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
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        {!isEditing ? (
                          <Button 
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Edit Donor
                          </Button>
                        ) : (
                          <div className="space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsEditing(false);
                                setEditedDonorData(selectedItem);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSaveDonorChanges}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </div>

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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          {isEditing ? (
                            <Input 
                              value={editedDonorData.Name || ''} 
                              onChange={(e) => handleDonorChange('Name', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          ) : (
                            <p className="text-gray-900">{selectedItem.Name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                          {isEditing ? (
                            <Select 
                              value={editedDonorData.BloodGroup || ''} 
                              onValueChange={(val) => handleDonorChange('BloodGroup', val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Blood Group" />
                              </SelectTrigger>
                              <SelectContent>
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                                  <SelectItem key={group} value={group}>{group}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-900">{selectedItem.BloodGroup}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{selectedItem.Email}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                          {isEditing ? (
                            <Input 
                              value={editedDonorData.MobileNumber || ''} 
                              onChange={(e) => handleDonorChange('MobileNumber', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          ) : (
                            <p className="text-gray-900">{selectedItem.MobileNumber}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                          {isEditing ? (
                            <Input 
                              value={editedDonorData.WhatsappNumber || ''} 
                              onChange={(e) => handleDonorChange('WhatsappNumber', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          ) : (
                            <p className="text-gray-900">{selectedItem.WhatsappNumber}</p>
                          )}
                        </div>

                        {isEditing && (
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                              <Checkbox 
                                checked={sameAsPermanent}
                                onCheckedChange={(checked) => {
                                  setSameAsPermanent(checked);
                                  if (checked) {
                                    handleDonorChange('ResidentCity', editedDonorData.PermanentCity);
                                  }
                                }}
                              />
                              <label className="text-sm text-gray-600">Current residence same as permanent address</label>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Permanent City</label>
                          {isEditing ? (
                            <Select 
                              value={editedDonorData.PermanentCity || ''} 
                              onValueChange={(val) => handleDonorChange('PermanentCity', val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Permanent City" />
                              </SelectTrigger>
                              <SelectContent>
                                {tamilNaduCities.map((city) => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-900">{selectedItem.PermanentCity || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Current City</label>
                          {isEditing && !sameAsPermanent ? (
                            <Select 
                              value={editedDonorData.ResidentCity || ''} 
                              onValueChange={(val) => handleDonorChange('ResidentCity', val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Current City" />
                              </SelectTrigger>
                              <SelectContent>
                                {tamilNaduCities.map((city) => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-900">{selectedItem.ResidentCity || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          {isEditing ? (
                            <Select 
                              value={editedDonorData.State || ''} 
                              onValueChange={(val) => handleDonorChange('State', val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent>
                                {["Tamil Nadu"].map((state) => (
                                  <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-900">{selectedItem.State}</p>
                          )}
                        </div>
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

        {/* Add User Details Modal */}
        <Dialog 
          open={isUserDetailsModalOpen} 
          onOpenChange={(open) => { 
            setIsUserDetailsModalOpen(open); 
            if (!open) {
              setUserDetailsData(null);
              setUserDonorData(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
            </DialogHeader>
            
            {userDetailsData && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">User Account Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{userDetailsData.email}</p>
                    </div>
                    
                    {userDetailsData.role === 'admin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned City</label>
                        <p className="text-gray-900">{userDetailsData.assignedCity || 'None assigned'}</p>
                      </div>
                    )}
                    
                    
                    {/* Display any custom user fields */}
                    {Object.entries(userDetailsData)
                      .filter(([key]) => !['id', 'email', 'role', 'createdAt', 'lastLogin', 'assignedCity'].includes(key))
                      .map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {userDonorData ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-green-800">Donor Information</h3>
                      <Button 
                        onClick={() => {
                          setSelectedItem(userDonorData);
                          setModalType('donor');
                          setEditedDonorData(userDonorData);
                          setSameAsPermanent(userDonorData.PermanentCity === userDonorData.ResidentCity);
                          setIsModalOpen(true);
                          setIsUserDetailsModalOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        Edit Donor Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 flex justify-center mb-4">
                        {userDonorData.profile_picture ? (
                          <Image 
                            src={userDonorData.profile_picture} 
                            alt={userDonorData.Name} 
                            width={100} 
                            height={100} 
                            className="rounded-full object-cover border-4 border-green-100"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-bold text-2xl">
                              {userDonorData.Name && userDonorData.Name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{userDonorData.Name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                        <p className="text-gray-900">{userDonorData.BloodGroup}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                        <p className="text-gray-900">{userDonorData.MobileNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                        <p className="text-gray-900">{userDonorData.WhatsappNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Permanent City</label>
                        <p className="text-gray-900">{userDonorData.PermanentCity || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current City</label>
                        <p className="text-gray-900">{userDonorData.ResidentCity || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <p className="text-gray-900">{userDonorData.State}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Donation Date</label>
                        <p className="text-gray-900">{userDonorData.lastDonationDate || 'No donations recorded'}</p>
                      </div>
                      
                      {/* Display any other donor fields not explicitly listed */}
                      {Object.entries(userDonorData)
                        .filter(([key]) => !['id', 'Name', 'BloodGroup', 'Email', 'MobileNumber', 
                                            'WhatsappNumber', 'PermanentCity', 'ResidentCity', 
                                            'State', 'lastDonationDate', 'profile_picture'].includes(key))
                        .map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-600">This user is not registered as a donor.</p>
                    <p className="text-sm text-gray-500 mt-1">No donor profile found with this email address.</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add the Donors Modal */}
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
                            <div>
                              <p className="text-sm text-gray-500">City</p>
                              <p className="font-medium">{donation.donorDetails.ResidentCity}</p>
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
