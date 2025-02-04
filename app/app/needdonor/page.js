"use client"

import { useState } from "react"
import Stepper from "../components/Stepper"

export default function RequestDonor() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    patientName: "",
    bloodType: "",
    unitsNeeded: "",
    hospital: "",
    urgency: "",
    contactName: "",
    contactPhone: "",
  })

  const steps = ["Patient Info", "Request Details", "Contact Info"]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Here you would typically send the data to your backend
    alert("Your blood donor request has been submitted for verification.")
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-4xl font-bold mb-4">Request Blood Donor</h1>
      <Stepper steps={steps} currentStep={currentStep} />
      <form onSubmit={handleSubmit} className="max-w-md">
        {currentStep === 0 && (
          <div>
            <div className="mb-4">
              <label htmlFor="patientName" className="block mb-2">
                Patient Name
              </label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                required
                className="input-field"
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="bloodType" className="block mb-2">
                Blood Type Needed
              </label>
              <select id="bloodType" name="bloodType" required className="input-field" onChange={handleChange}>
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div>
            <div className="mb-4">
              <label htmlFor="unitsNeeded" className="block mb-2">
                Units Needed
              </label>
              <input
                type="number"
                id="unitsNeeded"
                name="unitsNeeded"
                required
                className="input-field"
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="hospital" className="block mb-2">
                Hospital
              </label>
              <input
                type="text"
                id="hospital"
                name="hospital"
                required
                className="input-field"
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="urgency" className="block mb-2">
                Urgency
              </label>
              <select id="urgency" name="urgency" required className="input-field" onChange={handleChange}>
                <option value="">Select Urgency</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div>
            <div className="mb-4">
              <label htmlFor="contactName" className="block mb-2">
                Contact Name
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                required
                className="input-field"
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="contactPhone" className="block mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                required
                className="input-field"
                onChange={handleChange}
              />
            </div>
          </div>
        )}
        <div className="flex justify-between mt-4">
          {currentStep > 0 && (
            <button type="button" onClick={handlePrevious} className="btn-primary">
              Previous
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button type="submit" className="btn-primary">
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

