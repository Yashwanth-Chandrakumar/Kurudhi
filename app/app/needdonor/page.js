'use client'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex justify-between mb-8 relative">
      <div className="absolute top-4 left-0 w-full h-1 bg-gray-100">
        <div 
          className="absolute h-full bg-red-600 transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center relative z-10">
          <div className={`
            rounded-full h-10 w-10 flex items-center justify-center shadow-md
            transition-colors duration-300
            ${index <= currentStep 
              ? "bg-red-600 text-white ring-2 ring-red-200" 
              : "bg-white text-red-600 ring-2 ring-red-100"}
          `}>
            {index + 1}
          </div>
          <div className="text-sm mt-2 font-medium text-red-700">{step}</div>
        </div>
      ))}
    </div>
  )
}

const RequestDonor = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    reasonForBlood: '',
    bloodGroup: '',
    unitsNeeded: '',
    hospital: '',
    attenderName: '',
    attenderMobile: '',
    country: '',
    state: '',
    city: ''
  })
const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const steps = ['Patient Details', 'Medical Info', 'Contact Details']

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.patientName && formData.age && formData.gender
      case 1:
        return formData.bloodGroup && formData.unitsNeeded && formData.hospital && formData.reasonForBlood
      case 2:
        return formData.attenderName && formData.attenderMobile && formData.country && 
               formData.state && formData.city
      default:
        return false
    }
  }

  const handleNext = () => {
    if (isStepValid()) setCurrentStep(prev => prev + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Prepare request data for Firestore
      const requestData = {
        AttenderName: formData.attenderName,
        AttenderMobile: parseInt(formData.attenderMobile),
        BloodGroup: formData.bloodGroup,
        City: formData.city,
        Country: formData.country,
        Gender: formData.gender,
        Hospital: formData.hospital,
        PatientAge: parseInt(formData.age),
        PatientName: formData.patientName,
        Reason: formData.reasonForBlood,
        State: formData.state,
        UnitsNeeded: parseInt(formData.unitsNeeded),
        Verified: 'received'
      };
  
      // Add document to 'requests' collection
      const docRef = await addDoc(collection(db, 'requests'), requestData);
      
      console.log('Blood request registered with ID: ', docRef.id);
      alert('Your blood request has been submitted successfully!');
    } catch (error) {
      console.error('Error adding request: ', error);
      alert('Failed to submit. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
          Blood Donation Request
        </h1>
        <Card className="border-2 border-red-100 shadow-lg">
          <CardContent className="pt-8">
            <Stepper steps={steps} currentStep={currentStep} />
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-700">Patient Name</Label>
                    <Input
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter patient's full name"
                    />
                  </div>
                  <div>
                    <Label className="text-red-700">Age</Label>
                    <Input
                      name="age"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter patient's age"
                    />
                  </div>
                  <div>
                    <Label className="text-red-700">Gender</Label>
                    <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                      <SelectTrigger className="border-red-200">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-700">Reason for Blood Requirement</Label>
                    <Textarea
                      name="reasonForBlood"
                      value={formData.reasonForBlood}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Please specify the reason"
                    />
                  </div>
                  <div>
                    <Label className="text-red-700">Blood Group Required</Label>
                    <Select name="bloodGroup" value={formData.bloodGroup} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                      <SelectTrigger className="border-red-200">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-red-700">Units Required</Label>
                    <Input
                      name="unitsNeeded"
                      type="number"
                      min="1"
                      value={formData.unitsNeeded}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter units needed"
                    />
                  </div>
                  <div>
                    <Label className="text-red-700">Hospital Name</Label>
                    <Input
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter hospital name"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-700">Attender Name</Label>
                    <Input
                      name="attenderName"
                      value={formData.attenderName}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter attender's name"
                    />
                  </div>
                  <div>
                    <Label className="text-red-700">Attender Number</Label>
                    <Input
                      name="attenderMobile"
                      type="tel"
                      value={formData.attenderMobile}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <Label className="text-red-700">Country</Label>
                    <Select name="country" value={formData.country} onValueChange={(value) => handleSelectChange('country', value)}>
                      <SelectTrigger className="border-red-200">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-red-700">State</Label>
                    <Select name="state" value={formData.state} onValueChange={(value) => handleSelectChange('state', value)}>
                      <SelectTrigger className="border-red-200">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-red-700">City</Label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter city name"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                {currentStep > 0 && (
                  <Button 
                    type="button" 
                    onClick={handlePrevious}
                    variant="outline"
                    className="border-2 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="ml-auto bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={!isStepValid()}
                    className="ml-auto bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
                  >
                    Submit Request
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RequestDonor