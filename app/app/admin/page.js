'use client'
import { useState, useEffect } from 'react'
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  // For camps, we already have activeCampFilter (as in your existing code)
  const [activeCampFilter, setActiveCampFilter] = useState('all')

  // For viewing more details in a modal
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)

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
  // (Assumes each camp document has CampStart and CampEnd fields)
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

  // Handle updating a request’s status
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

  // Open details modal
  const openDetailsModal = (item, type) => {
    setSelectedItem(item)
    setModalType(type)
    setIsModalOpen(true)
  }

  // Filter data based on active tab
  let filteredData = []
  if (activeTab === 'requests') {
    // For requests, apply activeRequestFilter if not "all"
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header with title and Host a Camp button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-red-600">Admin Dashboard</h1>
        <Button
          onClick={() => router.push('/camp')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Host a Camp
        </Button>
      </div>

      {/* Stats Cards for Requests & Donors */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Current Requests', value: stats.currentRequests, color: 'bg-blue-500', filter: 'received' },
          { label: 'Ongoing Requests', value: stats.ongoingRequests, color: 'bg-yellow-500', filter: 'accepted' },
          { label: 'Completed Requests', value: stats.completedRequests, color: 'bg-green-500', filter: 'completed' },
          { label: 'Rejected Requests', value: stats.rejectedRequests, color: 'bg-red-500', filter: 'rejected' },
          { label: 'All Requests', value: stats.totalRequests, color: 'bg-indigo-500', filter: 'all' }
        ].map(({ label, value, color, filter }) => (
          <div
            key={label}
            className={`p-4 rounded-lg shadow ${color} text-white cursor-pointer`}
            onClick={() => {
              setActiveTab('requests')
              setActiveRequestFilter(filter)
              setCurrentPage(1)
            }}
          >
            <h3 className="text-lg">{label}</h3>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Stats Cards for Camps */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'All Camps', value: camps.length, color: 'bg-indigo-500', filter: 'all' },
          { label: 'Upcoming Camps', value: stats.upcomingCamps, color: 'bg-blue-400', filter: 'upcoming' },
          { label: 'Ongoing Camps', value: stats.ongoingCamps, color: 'bg-green-400', filter: 'ongoing' },
          { label: 'Completed Camps', value: stats.completedCamps, color: 'bg-gray-500', filter: 'completed' }
        ].map(({ label, value, color, filter }) => (
          <div
            key={label}
            className={`p-4 rounded-lg shadow ${color} text-white cursor-pointer`}
            onClick={() => {
              setActiveTab('camps')
              setActiveCampFilter(filter)
              setCurrentPage(1)
            }}
          >
            <h3 className="text-lg">{label}</h3>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Data Table Section */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Blood Requests</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Patient Name</th>
                <th className="p-3 text-left">Blood Group</th>
                <th className="p-3 text-left">Hospital</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(request => (
                <tr key={request.id} className="border-b">
                  <td className="p-3">{request.PatientName}</td>
                  <td className="p-3">{request.BloodGroup}</td>
                  <td className="p-3">{request.Hospital}</td>
                  <td className="p-3">
                    {request.Verified === "received" && (
                      <>
                        <button
                          onClick={() => updateRequestStatus(request.id, 'accepted')}
                          className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateRequestStatus(request.id, 'rejected')}
                          className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {request.Verified === "accepted" && (
                      <button
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => openDetailsModal(request, 'request')}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Donors</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Blood Group</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(donor => (
                <tr key={donor.id} className="border-b">
                  <td className="p-3">{donor.Name}</td>
                  <td className="p-3">{donor.BloodGroup}</td>
                  <td className="p-3">{donor.MobileNumber}</td>
                  <td className="p-3">
                    <button
                      onClick={() => openDetailsModal(donor, 'donor')}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'camps' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Blood Camps</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Camp Name</th>
                <th className="p-3 text-left">Date Range</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(camp => (
                <tr key={camp.id} className="border-b">
                  <td className="p-3">{camp.CampName}</td>
                  <td className="p-3">
                    {new Date(camp.CampStart).toLocaleString()} - {new Date(camp.CampEnd).toLocaleString()}
                  </td>
                  <td className="p-3">{camp.CampLocation}</td>
                  <td className="p-3 capitalize">{camp.CampStatus}</td>
                  <td className="p-3">
                    <button
                      onClick={() => openDetailsModal(camp, 'camp')}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="join">
          <button
            className="join-item btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </button>
          <button
            className="join-item btn"
            disabled={currentItems.length < itemsPerPage}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'request'
                ? 'Request Details'
                : modalType === 'donor'
                ? 'Donor Details'
                : 'Camp Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
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
                    <p className="font-semibold">Camp Start:</p>
                    <p>{new Date(selectedItem.CampStart).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Camp End:</p>
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
  )
}
