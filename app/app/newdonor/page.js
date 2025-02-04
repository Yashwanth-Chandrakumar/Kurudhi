'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex justify-between mb-8 relative">
      <div className="absolute top-4 left-0 w-full h-1 bg-gray-200">
        <div 
          className="absolute h-full bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center relative z-10">
          <div className={`
            rounded-full h-8 w-8 flex items-center justify-center
            ${index <= currentStep 
              ? "bg-primary text-white" 
              : "bg-white border-2 border-gray-300 text-gray-500"}
          `}>
            {index + 1}
          </div>
          <div className="text-sm mt-2 font-medium text-gray-600">{step}</div>
        </div>
      ))}
    </div>
  )
}

export default function BecomeDonor() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    email: '',
    mobile: '',
    whatsapp: '',
    country: '',
    state: '',
    permanentAddress: '',
    residentialAddress: '',
    sameAsPermenant: false,
    acceptTerms: false
  })

  const steps = ['Personal Details', 'Contact Info', 'Address', 'Confirmation']

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddressCheckbox = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsPermenant: checked,
      residentialAddress: checked ? prev.permanentAddress : ''
    }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.age && formData.gender && formData.bloodGroup
      case 1:
        return formData.email && formData.mobile && formData.whatsapp
      case 2:
        return formData.country && formData.state && formData.permanentAddress && 
               (formData.sameAsPermenant || formData.residentialAddress)
      case 3:
        return formData.acceptTerms
      default:
        return false
    }
  }

  const handleNext = () => {
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.acceptTerms) {
      console.log('Form submitted:', formData)
      // Here you would typically send the data to your backend
      alert('Thank you for registering as a donor!')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Become a Blood Donor</h1>
      <Card>
        <CardContent className="pt-6">
          <Stepper steps={steps} currentStep={currentStep} />
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter your age"
                    required
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Select name="bloodGroup" value={formData.bloodGroup} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="Enter your WhatsApp number"
                    required
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Country</Label>
                  <Select name="country" value={formData.country} onValueChange={(value) => handleSelectChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State</Label>
                  <Select name="state" value={formData.state} onValueChange={(value) => handleSelectChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      {/* Add more states as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permanentAddress">Permanent Address</Label>
                  <Input
                    id="permanentAddress"
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    placeholder="Enter your permanent address"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAddress"
                    checked={formData.sameAsPermenant}
                    onCheckedChange={handleAddressCheckbox}
                  />
                  <Label htmlFor="sameAddress">Same as permanent address</Label>
                </div>
                {!formData.sameAsPermenant && (
                  <div>
                    <Label htmlFor="residentialAddress">Residential Address</Label>
                    <Input
                      id="residentialAddress"
                      name="residentialAddress"
                      value={formData.residentialAddress}
                      onChange={handleChange}
                      placeholder="Enter your residential address"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleChange({
                      target: { name: 'acceptTerms', type: 'checkbox', checked }
                    })}
                  />
                  <Label htmlFor="acceptTerms">
                    I accept the terms and conditions
                  </Label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {currentStep > 0 && (
                <Button 
                  type="button" 
                  onClick={handlePrevious}
                  variant="outline"
                >
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="ml-auto"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={!isStepValid()}
                  className="ml-auto"
                >
                  Submit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}