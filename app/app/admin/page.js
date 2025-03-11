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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
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

  // Define fetchRequests BEFORE any useEffect calls
  const fetchRequests = async () => {
    // Only fetch if user has proper permissions
    if (!userRole || (userRole !== 'admin' && userRole !== 'superadmin')) {
      return;
    }
    
    const requestsCollection = collection(db, 'requests')
    let requestQuery = requestsCollection;
    
    // Filter by assigned city for admin users
    if (userRole === 'admin' && assignedCity) {
      requestQuery = query(requestsCollection, where("City", "==", assignedCity));
    }
    
    const requestSnapshot = await getDocs(requestQuery)
    const requestList = requestSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setRequests(requestList)
  }

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

  // Fetch data only if user is authorized
  useEffect(() => {
    if (!user) {
      return
    }

    const fetchDonors = async () => {
      // Only fetch if user has proper permissions
      if (!userRole || (userRole !== 'admin' && userRole !== 'superadmin')) {
        return;
      }
      
      const donorsCollection = collection(db, 'donors')
      const donorSnapshot = await getDocs(donorsCollection)
      const donorList = donorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDonors(donorList)
    }

    fetchDonors()
  }, [user, userRole])

  // Separate useEffect for fetching requests based on userRole and assignedCity
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'superadmin') {
      fetchRequests();
    }
  }, [userRole, assignedCity]);

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
    filteredData = donors
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
                        {request.Verified === "accepted" && (
                          <Button onClick={() => handleConfirmAction(request.id, 'completed')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">
                            Complete
                          </Button>
                        )}
                        <Button onClick={() => openDetailsModal(request, 'request')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
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
        {activeTab !== 'donors' && (
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
                        <p className="font-semibold">Verified</p>
                        <p>{selectedItem.Verified}</p>
                      </div>
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
      </div>
    </div>
  )
}
