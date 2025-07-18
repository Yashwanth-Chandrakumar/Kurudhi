"use client";

import React, { useState, useEffect } from 'react';
import { Eye, Mail, Phone, User, Calendar, Shield, MessageCircle, CheckCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const SupportPage = () => {
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchSupportRequests = async () => {
      try {
        // Set up real-time listener for support requests
        const unsubscribe = onSnapshot(collection(db, 'support'), (snapshot) => {
          const requests = [];
          snapshot.forEach((doc) => {
            requests.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Sort by creation date (newest first)
          requests.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
          
          setSupportRequests(requests);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching support requests:', error);
          setError(error.message);
          setLoading(false);
        });

        // Return cleanup function
        return () => unsubscribe();
      } catch (err) {
        console.error('Error setting up listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSupportRequests();
  }, [db]);

  const handleMarkAsResolved = async (requestId) => {
    setUpdating(true);
    try {
      const requestRef = doc(db, 'support', requestId);
      await updateDoc(requestRef, {
        Status: 'resolved',
        UpdatedAt: new Date().toISOString()
      });
      
      // Update the selected request if it's the one being updated
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => ({
          ...prev,
          Status: 'resolved',
          UpdatedAt: new Date().toISOString()
        }));
      }
      
      console.log('Support request marked as resolved');
    } catch (error) {
      console.error('Error updating support request:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 'text-red-900 bg-red-200';
      case 'urgent':
        return 'text-red-900 bg-red-200';
      case 'high':
        return 'text-yellow-900 bg-yellow-200';
      case 'normal':
        return 'text-green-900 bg-green-200';
      default:
        return 'text-gray-900 bg-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-orange-900 bg-orange-200';
      case 'resolved':
        return 'text-green-900 bg-green-200';
      case 'in-progress':
        return 'text-blue-900 bg-blue-200';
      default:
        return 'text-gray-900 bg-gray-200';
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = supportRequests.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading Support Tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl font-semibold">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-500 mr-3" />
                      <p className="text-gray-900 whitespace-no-wrap font-semibold">{request.Name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{request.Subject}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${getPriorityColor(request.Priority)}`}>
                      <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                      <span className="relative">{request.Priority}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${getStatusColor(request.Status)}`}>
                      <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                      <span className="relative capitalize">{request.Status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{new Date(request.CreatedAt).toLocaleString()}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button 
                      onClick={() => setSelectedRequest(request)} 
                      className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {supportRequests.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <span className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, supportRequests.length)} of {supportRequests.length} Queries
            </span>
            <div className="flex items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 text-sm font-semibold">
                Page {currentPage} of {Math.ceil(supportRequests.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(supportRequests.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(supportRequests.length / itemsPerPage)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {supportRequests.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No support requests found</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-800">Support Ticket Details</h3>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-800">{selectedRequest.Name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">{selectedRequest.Email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-800">{selectedRequest.Phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">User Type</p>
                    <p className="font-semibold text-gray-800">{selectedRequest.UserType}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Received On</p>
                    <p className="font-semibold text-gray-800">{new Date(selectedRequest.CreatedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(selectedRequest.Priority)}`}>
                    Priority: {selectedRequest.Priority}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRequest.Status)}`}>
                    Status: {selectedRequest.Status}
                  </div>
                </div>
                
                {selectedRequest.BloodGroup && (
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>
                      <p className="font-semibold text-gray-800">{selectedRequest.BloodGroup}</p>
                    </div>
                  </div>
                )}
                
                {selectedRequest.Location && (
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold text-gray-800">{selectedRequest.Location}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="w-6 h-6 text-red-500 mt-1"/>
                  <div>
                    <p className="text-sm text-gray-500">Message</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedRequest.Message}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
              
              {selectedRequest.Status !== 'resolved' && (
                <button 
                  onClick={() => handleMarkAsResolved(selectedRequest.id)}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </>
                  )}
                </button>
              )}
              
              {selectedRequest.Status === 'resolved' && (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-semibold flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolved
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;