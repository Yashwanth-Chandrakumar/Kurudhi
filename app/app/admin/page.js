'use client'

import { useState, useEffect } from 'react'
import { 
  initializeApp, 
  getApps, 
  getApp 
} from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)

export default function AdminDashboard() {
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [stats, setStats] = useState({
    totalRequests: 0,
    currentRequests: 0,
    ongoingRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    totalDonors: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [activeTab, setActiveTab] = useState('current')
  const itemsPerPage = 10

  // Fetch Requests
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      setRequests(requestsList);
  
      // Updating statistics
      setStats(prev => ({
        ...prev,
        totalRequests: requestsList.length,
        currentRequests: requestsList.filter(req => req.Verified === "received").length,
        ongoingRequests: requestsList.filter(req => req.Verified === "accepted").length,
        completedRequests: requestsList.filter(req => req.Verified === "completed").length,
        rejectedRequests: requestsList.filter(req => req.Verified === "rejected").length
      }));
    });
  
    return () => unsubscribe();
  }, []);
  
  // Fetch Donors
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'donors'), (snapshot) => {
      const donorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      setDonors(donorsList);
  
      setStats(prev => ({
        ...prev,
        totalDonors: donorsList.length
      }));
    });
  
    return () => unsubscribe();
  }, []);
  
  // Handle Request Actions
  const updateRequestStatus = async (id, status) => {
    try {
      const requestRef = doc(db, 'requests', id)
      await updateDoc(requestRef, { 
        Verified: status 
      })
      
      // Update local state
      setRequests(prev => 
        prev.map(request => 
          request.id === id ? { ...request, Verified: status } : request
        )
      )
  
      // Update stats
      setStats(prev => {
        const newStats = { ...prev }
        
        // Reset counts based on previous and new status
        if (prev.Verified === "received" && status === "accepted") {
          newStats.currentRequests -= 1
          newStats.ongoingRequests += 1
        } else if (prev.Verified === "accepted" && status === "completed") {
          newStats.ongoingRequests -= 1
          newStats.completedRequests += 1
        } else if (status === "rejected") {
          newStats.currentRequests -= 1
          newStats.rejectedRequests += 1
        }
        
        return newStats
      })
  
      alert(`Request ${status} successfully`)
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request')
    }
  }

  // Open Modal for More Details
  const openDetailsModal = (item, type) => {
    setSelectedItem(item)
    setModalType(type)
    setIsModalOpen(true)
  }

  // Filter Requests based on Active Tab
  const filterRequests = () => {
    switch(activeTab) {
      case 'current':
        return requests.filter(req => req.Verified === "received")
      case 'ongoing':
        return requests.filter(req => req.Verified === "accepted")
      case 'completed':
        return requests.filter(req => req.Verified === "completed")
      case 'rejected':
        return requests.filter(req => req.Verified === "rejected")
      case 'all':
        return requests
      default:
        return requests.filter(req => req.Verified === "received")
    }
  }

  // Pagination Logic
  const filteredRequests = filterRequests()
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-red-600">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Current Requests', value: stats.currentRequests, color: 'bg-blue-500', tab: 'current' },
          { label: 'Ongoing Requests', value: stats.ongoingRequests, color: 'bg-yellow-500', tab: 'ongoing' },
          { label: 'Completed Requests', value: stats.completedRequests, color: 'bg-green-500', tab: 'completed' },
          { label: 'Rejected Requests', value: stats.rejectedRequests, color: 'bg-red-500', tab: 'rejected' },
          { label: 'Total Donors', value: stats.totalDonors, color: 'bg-purple-500', tab: 'donors' }
        ].map(({ label, value, color, tab }) => (
          <div 
            key={label} 
            className={`p-4 rounded-lg shadow ${color} text-white cursor-pointer`}
            onClick={() => setActiveTab(tab === 'donors' ? 'donors' : tab)}
          >
            <h3 className="text-lg">{label}</h3>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      {activeTab !== 'donors' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            {activeTab === 'current' ? 'Current Requests' : 
             activeTab === 'ongoing' ? 'Ongoing Requests' : 
             activeTab === 'completed' ? 'Completed Requests' : 
             activeTab === 'rejected' ? 'Rejected Requests' : 
             'All Requests'}
          </h2>
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
              {currentRequests.map(request => (
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

      {/* Donors Table */}
      {activeTab === 'donors' && (
        <div className="bg-white shadow rounded-lg p-6">
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
              {donors.slice(indexOfFirstItem, indexOfLastItem).map(donor => (
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
            disabled={currentRequests.length < itemsPerPage}
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
              {modalType === 'request' ? 'Request Details' : 'Donor Details'}
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
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Age</p>
                    <p>{selectedItem.Age}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Blood Group</p>
                    <p>{selectedItem.BloodGroup}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Country</p>
                    <p>{selectedItem.Country}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p>{selectedItem.Email}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Gender</p>
                    <p>{selectedItem.Gender}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Mobile Number</p>
                    <p>{selectedItem.MobileNumber}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Name</p>
                    <p>{selectedItem.Name}</p>
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}