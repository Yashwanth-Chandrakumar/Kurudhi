'use client'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const Stepper = ({ steps, currentStep }) => (
  <div className="flex justify-between mb-8 relative">
    <div className="absolute top-4 left-0 w-full h-1 bg-red-100">
      <div 
        className="absolute h-full bg-red-600 transition-all duration-300"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />
    </div>
    {steps.map((step, index) => (
      <div key={index} className="flex flex-col items-center relative z-10">
        <div className={`
          rounded-full h-10 w-10 flex items-center justify-center shadow-md
          ${index <= currentStep 
            ? "bg-red-600 text-white ring-2 ring-red-200" 
            : "bg-white border-2 border-red-300 text-red-600"}
        `}>
          {index + 1}
        </div>
        <div className="text-sm mt-2 font-medium text-red-700">{step}</div>
      </div>
    ))}
  </div>
)

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
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
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
      case 0: return formData.name && formData.age && formData.gender && formData.bloodGroup
      case 1: return formData.email && formData.mobile && formData.whatsapp
      case 2: return formData.country && formData.state && formData.permanentAddress && 
              (formData.sameAsPermenant || formData.residentialAddress)
      case 3: return formData.acceptTerms
      default: return false
    }
  }

  const handleNext = () => {
    if (isStepValid()) setCurrentStep(prev => prev + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (formData.acceptTerms) {
    try {
      // Prepare donor data for Firestore
      const donorData = {
        Age: parseInt(formData.age),
        BloodGroup: formData.bloodGroup,
        Country: formData.country,
        Email: formData.email,
        Gender: formData.gender,
        MobileNumber: parseInt(formData.mobile),
        Name: formData.name,
        PermanentAddress: formData.permanentAddress,
        ResidentialAddress: formData.residentialAddress || formData.permanentAddress,
        State: formData.state,
        WhatsappNumber: formData.whatsapp,
      };

      // Add document to 'donors' collection
      const docRef = await addDoc(collection(db, 'donors'), donorData);
      
      console.log('Donor registered with ID: ', docRef.id);
      alert('Thank you for registering as a donor!');
    } catch (error) {
      console.error('Error adding donor: ', error);
      alert('Failed to submit. Please try again.');
    }
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
          Become a Blood Donor
        </h1>
        <Card className="border-2 border-red-100 shadow-lg">
          <CardContent className="pt-8">
            <Stepper steps={steps} currentStep={currentStep} />
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  {['name', 'age'].map(field => (
                    <div key={field}>
                      <Label className="text-red-700 capitalize">{field}</Label>
                      <Input
                        name={field}
                        type={field === 'age' ? 'number' : 'text'}
                        min={field === 'age' ? "18" : undefined}
                        max={field === 'age' ? "65" : undefined}
                        value={formData[field]}
                        onChange={handleChange}
                        className="border-red-200 focus:ring-red-500"
                        placeholder={`Enter your ${field}`}
                      />
                    </div>
                  ))}
                  {['gender', 'bloodGroup'].map(field => (
                    <div key={field}>
                      <Label className="text-red-700">{field === 'bloodGroup' ? 'Blood Group' : 'Gender'}</Label>
                      <Select name={field} value={formData[field]} onValueChange={(value) => handleSelectChange(field, value)}>
                        <SelectTrigger className="border-red-200">
                          <SelectValue placeholder={`Select ${field === 'bloodGroup' ? 'blood group' : field}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field === 'gender' 
                            ? ['male', 'female', 'other'].map(value => (
                                <SelectItem key={value} value={value} className="capitalize">{value}</SelectItem>
                              ))
                            : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(value => (
                                <SelectItem key={value} value={value}>{value}</SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  {['email', 'mobile', 'whatsapp'].map(field => (
                    <div key={field}>
                      <Label className="text-red-700 capitalize">{field}</Label>
                      <Input
                        name={field}
                        type={field === 'email' ? 'email' : 'tel'}
                        value={formData[field]}
                        onChange={handleChange}
                        className="border-red-200 focus:ring-red-500"
                        placeholder={`Enter your ${field}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  {['country', 'state'].map(field => (
                    <div key={field}>
                      <Label className="text-red-700 capitalize">{field}</Label>
                      <Select name={field} value={formData[field]} onValueChange={(value) => handleSelectChange(field, value)}>
                        <SelectTrigger className="border-red-200">
                          <SelectValue placeholder={`Select ${field}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={field === 'country' ? 'india' : 'maharashtra'} className="capitalize">
                            {field === 'country' ? 'India' : 'Maharashtra'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <div>
                    <Label className="text-red-700">Permanent Address</Label>
                    <Input
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleChange}
                      className="border-red-200 focus:ring-red-500"
                      placeholder="Enter your permanent address"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAddress"
                      checked={formData.sameAsPermenant}
                      onCheckedChange={handleAddressCheckbox}
                      className="border-red-200 data-[state=checked]:bg-red-600"
                    />
                    <Label htmlFor="sameAddress" className="text-red-700">Same as permanent address</Label>
                  </div>
                  {!formData.sameAsPermenant && (
                    <div>
                      <Label className="text-red-700">Residential Address</Label>
                      <Input
                        name="residentialAddress"
                        value={formData.residentialAddress}
                        onChange={handleChange}
                        className="border-red-200 focus:ring-red-500"
                        placeholder="Enter your residential address"
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
                      className="border-red-200 data-[state=checked]:bg-red-600"
                    />
                    <Label htmlFor="acceptTerms" className="text-red-700">
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
                    Submit
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