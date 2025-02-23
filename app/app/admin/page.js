'use client'
import { useState, useEffect } from 'react'
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc  // <-- imported getDoc to fetch user details
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  const router = useRouter()

  // States for various collections
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [camps, setCamps] = useState([])

  // Stats for cards – including request stats, donor count, and camp stats
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

  // Pagination for table views
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // activeTab: "requests", "donors", or "camps"
  const [activeTab, setActiveTab] = useState('requests')
  // For requests, add an extra filter: one of "all", "received", "accepted", "completed", "rejected"
  const [activeRequestFilter, setActiveRequestFilter] = useState('all')
  // For camps, we already have activeCampFilter
  const [activeCampFilter, setActiveCampFilter] = useState('all')

  // For viewing more details in a modal
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)

  // NEW: State for confirmation modal for Accept/Reject actions
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: '', // e.g., 'accepted' or 'rejected'
    requestId: null,
    message: ''
  })

  // NEW: State for storing user details when viewing a request’s "More" info
  const [userDetails, setUserDetails] = useState(null)

  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Fetch blood requests in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setRequests(requestsList)
      setStats(prev => ({
        ...prev,
        totalRequests: requestsList.length,
        currentRequests: requestsList.filter(req => req.Verified === "received").length,
        ongoingRequests: requestsList.filter(req => req.Verified === "accepted").length,
        completedRequests: requestsList.filter(req => req.Verified === "completed").length,
        rejectedRequests: requestsList.filter(req => req.Verified === "rejected").length
      }))
    })
    return () => unsubscribe()
  }, [])

  // Fetch donors in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'donors'), (snapshot) => {
      const donorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDonors(donorsList)
      setStats(prev => ({
        ...prev,
        totalDonors: donorsList.length
      }))
    })
    return () => unsubscribe()
  }, [])

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

  // NEW: Function to handle opening confirmation modal for Accept/Reject actions
  const handleConfirmAction = (id, action) => {
    setConfirmModal({
      open: true,
      action, // either 'accepted' or 'rejected'
      requestId: id,
      message: `Are you sure you want to ${action} this request?`
    })
  }

  // Handle updating a request’s status (called after confirmation)
  const updateRequestStatus = async (id, status) => {
    try {
      const requestRef = doc(db, 'requests', id)
      await updateDoc(requestRef, { Verified: status })
      setRequests(prev =>
        prev.map(req =>
          req.id === id ? { ...req, Verified: status } : req
        )
      )
      alert(`Request ${status} successfully`)
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request')
    }
  }

  // NEW: Modified openDetailsModal to also fetch user details for requests
  const openDetailsModal = async (item, type) => {
    setSelectedItem(item)
    setModalType(type)
    setIsModalOpen(true)
    if (type === 'request' && item.uuid) {
      try {
        const userRef = doc(db, 'users', item.uuid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setUserDetails(userSnap.data())
        } else {
          setUserDetails({ error: 'No user details found' })
        }
      } catch (error) {
        console.error("Error fetching user details:", error)
        setUserDetails({ error: 'Failed to fetch user details' })
      }
    } else {
      setUserDetails(null)
    }
  }

  // Filter data based on active tab
  let filteredData = []
  if (activeTab === 'requests') {
    filteredData = activeRequestFilter === 'all'
      ? requests
      : requests.filter(req => req.Verified === activeRequestFilter)
  } else if (activeTab === 'donors') {
    filteredData = donors
  } else if (activeTab === 'camps') {
    filteredData =
      activeCampFilter === 'all'
        ? camps
        : camps.filter(camp => camp.CampStatus === activeCampFilter)
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  // Handle sidebar menu click
  const handleSidebarClick = (tab, filter) => {
    if (tab === 'requests') {
      setActiveTab('requests')
      setActiveRequestFilter(filter)
    } else if (tab === 'camps') {
      setActiveTab('camps')
      setActiveCampFilter(filter)
    } else if (tab === 'donors') {
      setActiveTab('donors')
    }
    setCurrentPage(1)
    setIsSidebarOpen(false) // Close sidebar on mobile
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-blue-900 to-gray-800 text-white p-6 space-y-6 shadow-xl">
<div>
<h2 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h2>
<p className="text-sm opacity-70">Manage your operations in style</p>
</div>
<nav className="flex-1 space-y-4">
<div>
<h3 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-1">Blood Requests</h3>
<ul className="space-y-2">
<li>
<button
onClick={() => handleSidebarClick('requests', 'received')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'received'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Current Requests <span className="opacity-70">({stats.currentRequests})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'accepted')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'accepted'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Ongoing Requests <span className="opacity-70">({stats.ongoingRequests})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'completed')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'completed'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Completed Requests <span className="opacity-70">({stats.completedRequests})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'rejected')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'rejected'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Rejected Requests <span className="opacity-70">({stats.rejectedRequests})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'all')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'all'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
All Requests <span className="opacity-70">({stats.totalRequests})</span>
</button>
</li>
</ul>
</div>
<div>
<h3 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-1">Blood Camps</h3>
<ul className="space-y-2">
<li>
<button
onClick={() => handleSidebarClick('camps', 'all')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'all'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
All Camps <span className="opacity-70">({camps.length})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('camps', 'upcoming')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'upcoming'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Upcoming Camps <span className="opacity-70">({stats.upcomingCamps})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('camps', 'ongoing')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'ongoing'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Ongoing Camps <span className="opacity-70">({stats.ongoingCamps})</span>
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('camps', 'completed')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'completed'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Completed Camps <span className="opacity-70">({stats.completedCamps})</span>
</button>
</li>
</ul>
</div>
<div>
<h3 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-1">Donors</h3>
<ul className="space-y-2">
<li>
<button
onClick={() => handleSidebarClick('donors')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'donors'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Donors <span className="opacity-70">({stats.totalDonors})</span>
</button>
</li>
</ul>
</div>
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
<div>
<h3 className="text-lg font-semibold mb-2">Blood Requests</h3>
<ul className="space-y-2">
<li>
<button
onClick={() => handleSidebarClick('requests', 'received')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'received'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Current Requests ({stats.currentRequests})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'accepted')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'accepted'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Ongoing Requests ({stats.ongoingRequests})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'completed')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'completed'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Completed Requests ({stats.completedRequests})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'rejected')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'rejected'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Rejected Requests ({stats.rejectedRequests})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('requests', 'all')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'requests' && activeRequestFilter === 'all'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
All Requests ({stats.totalRequests})
</button>
</li>
</ul>
</div>
<div>
<h3 className="text-lg font-semibold mb-2">Blood Camps</h3>
<ul className="space-y-2">
<li>
<button
onClick={() => handleSidebarClick('camps', 'all')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'all'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
All Camps ({camps.length})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('camps', 'upcoming')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'upcoming'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Upcoming ({stats.upcomingCamps})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('camps', 'ongoing')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'ongoing'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Ongoing ({stats.ongoingCamps})
</button>
</li>
<li>
<button
onClick={() => handleSidebarClick('camps', 'completed')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'camps' && activeCampFilter === 'completed'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Completed ({stats.completedCamps})
</button>
</li>
</ul>
</div>
<div>
<h3 className="text-lg font-semibold mb-2">Donors</h3>
<ul className="space-y-2">
<li>
<button
onClick={() => handleSidebarClick('donors')}
className={`w-full text-left px-4 py-2 rounded transition-all duration-300 ${
activeTab === 'donors'
? 'bg-red-600'
: 'hover:bg-gray-700'
}`}
>
Donors ({stats.totalDonors})
</button>
</li>
</ul>
</div>
</nav>
</DialogContent>
</Dialog>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 ml-0 ">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">Admin Dashboard</h1>
          {/* Mobile hamburger menu */}
          <button className="md:hidden p-2 rounded bg-gray-200 hover:bg-gray-300 transition" onClick={() => setIsSidebarOpen(true)}>
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>

        {/* Data Table Section */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Blood Requests</h2>
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
                            <button
                              // Instead of directly updating, we now open the confirmation modal
                              onClick={() => handleConfirmAction(request.id, 'accepted')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleConfirmAction(request.id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.Verified === "accepted" && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'completed')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => openDetailsModal(request, 'request')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                          More
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Donors and Camps sections remain unchanged */}
        {activeTab === 'donors' && (
          // ... donors table code ...
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Donors</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Blood Group</th>
                    <th className="px-6 py-3 font-semibold">Mobile</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(donor => (
                    <tr key={donor.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{donor.Name}</td>
                      <td className="px-6 py-4">{donor.BloodGroup}</td>
                      <td className="px-6 py-4">{donor.MobileNumber}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDetailsModal(donor, 'donor')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                          More
                        </button>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Blood Camps</h2>
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
                        <button
                          onClick={() => openDetailsModal(camp, 'camp')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                          More
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
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

        {/* Confirmation Modal for Accept/Reject actions */}
        <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ ...confirmModal, open })}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Confirm {confirmModal.action === 'accepted' ? 'Accept' : 'Reject'}
              </DialogTitle>
            </DialogHeader>
            <p>{confirmModal.message}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
                Cancel
              </Button>
              <Button onClick={() => {
                updateRequestStatus(confirmModal.requestId, confirmModal.action)
                setConfirmModal({ ...confirmModal, open: false })
              }}>
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setUserDetails(null) }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {modalType === 'request'
                  ? 'Request Details'
                  : modalType === 'donor'
                  ? 'Donor Details'
                  : 'Camp Details'}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4 mt-4">
                {modalType === 'request' ? (
                  <>
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
                      <div>
                        <p className="font-semibold">Units Donated</p>
                        <p>{selectedItem.UnitsDonated}</p>
                      </div>
                    </div>
                    {/* NEW: Display User Details if available */}
                    {selectedItem.uuid && (
                      <div className="mt-6">
                        <h3 className="text-xl font-bold">User Details</h3>
                        {userDetails ? (
                          <div className="mt-2">
                            {Object.entries(userDetails).map(([key, value]) => (
                              <div key={key} className="flex">
                                <p className="font-semibold mr-2">{key}:</p>
                                <p>{JSON.stringify(value)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>Loading user details...</p>
                        )}
                      </div>
                    )}
                  </>
                ) : modalType === 'donor' ? (
                  <div className="grid grid-cols-2 gap-4">
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
                      <p className="font-semibold">Permanent Address</p>
                      <p>{selectedItem.PermanentAddress}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Residential Address</p>
                      <p>{selectedItem.ResidentialAddress}</p>
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
