'use client'

import { useState } from 'react'
import Stepper from '../components/Stepper'

export default function BecomeDonor() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    bloodType: '',
    lastDonation: '',
    medicalConditions: '',
    address: '',
    phone: ''
  })

  const steps = ['Personal Info', 'Medical Info', 'Contact Info']

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
    console.log('Form submitted:', formData)
    // Here you would typically send the data to your backend
    alert('Thank you for registering as a donor!')
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-4xl font-bold mb-4">Become a Donor</h1>
      <Stepper steps={steps} currentStep={currentStep} />
      <form onSubmit={handleSubmit} className="max-w-md">
        {currentStep === 0 && (
          <div>
            <div className="mb-4">
              <label htmlFor="bloodType" className="block mb-2">Blood Type</label>
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
              <label htmlFor="lastDonation" className="block mb-2">Last Donation Date</label>
              <input type="date" id="lastDonation" name="lastDonation" className="input-field" onChange={handleChange} />
            </div>
            <div className="mb-4">
              <label htmlFor="medicalConditions" className="block mb-2">Medical Conditions</label>
              <textarea id="medicalConditions" name="medicalConditions" className="input-field" onChange={handleChange}></textarea>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div>
            <div className="mb-4">
              <label htmlFor="address" className="block mb-2">Address</label>
              <textarea id="address" name="address" required className="input-field" onChange={handleChange}></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block mb-2">Phone Number</label>
              <input type="tel" id="phone" name="phone" required className="input-field" onChange={handleChange} />
            </div>
          </div>
        )}
        <div className="flex justify-between mt-4">
          {currentStep > 0 && (
            <button type="button" onClick={handlePrevious} className="btn-primary">Previous</button>
          )}
          {currentStep < steps.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary">Next</button>
          ) : (
            <button type="submit" className="btn-primary">Submit</button>
          )}
        </div>
      </form>
    </div>
  )
}
