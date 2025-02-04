"use client"

import { useState } from "react"

export default function Admin() {
  const [requests, setRequests] = useState([
    { id: 1, patientName: "John Doe", bloodType: "A+", urgency: "High" },
    { id: 2, patientName: "Jane Smith", bloodType: "O-", urgency: "Medium" },
    // Add more mock data as needed
  ])

  const handleAccept = (id) => {
    // In a real application, you would send this to your backend
    console.log(`Accepted request ${id}`)
    // Remove the request from the list
    setRequests(requests.filter((request) => request.id !== id))
    // Here you would typically send notifications to donors
    alert("Notification sent to matching donors")
  }

  const handleReject = (id) => {
    // In a real application, you would send this to your backend
    console.log(`Rejected request ${id}`)
    // Remove the request from the list
    setRequests(requests.filter((request) => request.id !== id))
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
      <h2 className="text-2xl font-bold mb-4">Blood Donor Requests</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Patient Name</th>
            <th className="text-left">Blood Type</th>
            <th className="text-left">Urgency</th>
            <th className="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.patientName}</td>
              <td>{request.bloodType}</td>
              <td>{request.urgency}</td>
              <td>
                <button onClick={() => handleAccept(request.id)} className="btn-primary mr-2">
                  Accept
                </button>
                <button onClick={() => handleReject(request.id)} className="btn-primary bg-gray-500 hover:bg-gray-600">
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

