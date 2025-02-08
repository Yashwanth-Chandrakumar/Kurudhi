'use client'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal"
];

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Define validation rules for the blood camp form
const validationRules = {
  // Step 1: Organizer Details
  organizerName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: 'Organizer name is required',
      minLength: 'Name must be at least 2 characters long',
      maxLength: 'Name must be less than 50 characters',
      pattern: 'Name can only contain letters and spaces'
    }
  },
  organizerEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: {
      required: 'Email is required',
      pattern: 'Enter a valid email address'
    }
  },
  organizerMobile: {
    required: true,
    pattern: /^[0-9]{10}$/,
    message: {
      required: 'Mobile number is required',
      pattern: 'Enter a valid 10-digit mobile number'
    }
  },
  // Step 2: Camp Details
  campName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    message: {
      required: 'Camp name is required',
      minLength: 'Camp name must be at least 3 characters long',
      maxLength: 'Camp name must be less than 100 characters'
    }
  },
  campDate: {
    required: true,
    message: {
      required: 'Camp date is required'
    }
  },
  campLocation: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: {
      required: 'Camp location is required',
      minLength: 'Location must be at least 10 characters long',
      maxLength: 'Location must be less than 200 characters'
    }
  },
  campCity: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: 'City is required',
      minLength: 'City must be at least 2 characters long',
      maxLength: 'City must be less than 50 characters',
      pattern: 'City can only contain letters and spaces'
    }
  },
  campState: {
    required: true,
    enum: indianStates,
    message: {
      required: 'State is required',
      enum: 'Please select a valid state'
    }
  },
  campCountry: {
    required: true,
    enum: ['india'],
    message: {
      required: 'Country is required',
      enum: 'Please select a valid country'
    }
  },
  campDescription: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: {
      required: 'Camp description is required',
      minLength: 'Description must be at least 10 characters long',
      maxLength: 'Description must be less than 500 characters'
    }
  }
};

// Validation function that checks a single field against its rules
const validateField = (name, value, rules) => {
  const fieldRules = rules[name];
  if (!fieldRules) return '';

  if (fieldRules.required && !value) {
    return fieldRules.message.required;
  }

  if (value) {
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      return fieldRules.message.minLength;
    }
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      return fieldRules.message.maxLength;
    }
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      return fieldRules.message.pattern;
    }
    if (fieldRules.min && Number(value) < fieldRules.min) {
      return fieldRules.message.min;
    }
    if (fieldRules.max && Number(value) > fieldRules.max) {
      return fieldRules.message.max;
    }
    if (fieldRules.enum && !fieldRules.enum.includes(value)) {
      return fieldRules.message.enum;
    }
  }
  return '';
};

// A simple stepper component to indicate form progress
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
          <div
            className={`
              rounded-full h-10 w-10 flex items-center justify-center shadow-md
              transition-colors duration-300
              ${index <= currentStep 
                  ? "bg-red-600 text-white ring-2 ring-red-200" 
                  : "bg-white text-red-600 ring-2 ring-red-100"}
            `}
          >
            {index + 1}
          </div>
          <div className="text-sm mt-2 font-medium text-red-700">{step}</div>
        </div>
      ))}
    </div>
  );
};

const HostBloodCamp = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    // Step 1: Organizer Details
    organizerName: '',
    organizerEmail: '',
    organizerMobile: '',
    // Step 2: Camp Details
    campName: '',
    campDate: '',
    campLocation: '',
    campCity: '',
    campState: '',
    campCountry: 'india',
    campDescription: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const steps = ['Organizer Details', 'Camp Details', 'Review & Confirm'];

  // Validate a set of fields
  const validateForm = (data, fields) => {
    const newErrors = {};
    fields.forEach(field => {
      const error = validateField(field, data[field], validationRules);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value, validationRules);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name], validationRules);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value, validationRules);
    setErrors(prev => ({ ...prev, [name]: error }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  // Define which fields belong to each step
  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return ['organizerName', 'organizerEmail', 'organizerMobile'];
      case 1:
        return ['campName', 'campDate', 'campLocation', 'campCity', 'campState', 'campCountry', 'campDescription'];
      default:
        return [];
    }
  };

  // For the review step, we simply allow submission.
  const isStepValid = () => {
    if (currentStep === steps.length - 1) return true;
    const stepFields = getStepFields(currentStep);
    const stepErrors = validateForm(formData, stepFields);
    const hasErrors = Object.keys(stepErrors).length > 0;
    const allFieldsFilled = stepFields.every(field => formData[field]);
    return !hasErrors && allFieldsFilled;
  };

  const handleNext = () => {
    const stepFields = getStepFields(currentStep);
    stepFields.forEach(field => handleBlur(field));
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Called when the user clicks "Submit Request" on the review step.
  const handleSubmit = async () => {
    const allFields = [
      ...getStepFields(0),
      ...getStepFields(1)
    ];
    const formErrors = validateForm(formData, allFields);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    try {
      const campData = {
        OrganizerName: formData.organizerName,
        OrganizerEmail: formData.organizerEmail,
        OrganizerMobile: formData.organizerMobile,
        CampName: formData.campName,
        CampDate: formData.campDate,
        CampLocation: formData.campLocation,
        CampCity: formData.campCity,
        CampState: formData.campState,
        CampCountry: formData.campCountry,
        CampDescription: formData.campDescription,
        CreatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'camps'), campData);
      console.log('Blood camp hosted with ID: ', docRef.id);
      setSubmitStatus({
        type: 'success',
        message: 'Your blood camp has been hosted successfully!'
      });

      // After 2 seconds, navigate to the home page.
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error) {
      console.error('Error hosting camp: ', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to host camp. Please try again.'
      });
    }
  };

  const renderError = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <p className="text-sm text-red-500 mt-1">{errors[fieldName]}</p>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
          Host a Blood Camp
        </h1>
        
        {/* Submit status message */}
        {submitStatus.message && (
          <div className={`mb-4 p-4 border rounded ${submitStatus.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'}`}>
            {submitStatus.message}
          </div>
        )}
        
        <Card className="border-2 border-red-100 shadow-lg">
          <CardContent className="pt-8">
            <Stepper steps={steps} currentStep={currentStep} />
            <form className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-700">Organizer Name</Label>
                    <Input
                      name="organizerName"
                      value={formData.organizerName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('organizerName')}
                      className={`border-red-200 focus:ring-red-500 ${touched.organizerName && errors.organizerName ? 'border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {renderError('organizerName')}
                  </div>
                  <div>
                    <Label className="text-red-700">Organizer Email</Label>
                    <Input
                      name="organizerEmail"
                      type="email"
                      value={formData.organizerEmail}
                      onChange={handleChange}
                      onBlur={() => handleBlur('organizerEmail')}
                      className={`border-red-200 focus:ring-red-500 ${touched.organizerEmail && errors.organizerEmail ? 'border-red-500' : ''}`}
                      placeholder="Enter your email address"
                    />
                    {renderError('organizerEmail')}
                  </div>
                  <div>
                    <Label className="text-red-700">Organizer Mobile</Label>
                    <Input
                      name="organizerMobile"
                      type="tel"
                      value={formData.organizerMobile}
                      onChange={handleChange}
                      onBlur={() => handleBlur('organizerMobile')}
                      className={`border-red-200 focus:ring-red-500 ${touched.organizerMobile && errors.organizerMobile ? 'border-red-500' : ''}`}
                      placeholder="Enter your 10-digit mobile number"
                    />
                    {renderError('organizerMobile')}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-700">Camp Name</Label>
                    <Input
                      name="campName"
                      value={formData.campName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('campName')}
                      className={`border-red-200 focus:ring-red-500 ${touched.campName && errors.campName ? 'border-red-500' : ''}`}
                      placeholder="Enter camp name"
                    />
                    {renderError('campName')}
                  </div>
                  <div>
                    <Label className="text-red-700">Camp Date</Label>
                    <Input
                      name="campDate"
                      type="date"
                      value={formData.campDate}
                      onChange={handleChange}
                      onBlur={() => handleBlur('campDate')}
                      className={`border-red-200 focus:ring-red-500 ${touched.campDate && errors.campDate ? 'border-red-500' : ''}`}
                    />
                    {renderError('campDate')}
                  </div>
                  <div>
                    <Label className="text-red-700">Camp Location</Label>
                    <Input
                      name="campLocation"
                      value={formData.campLocation}
                      onChange={handleChange}
                      onBlur={() => handleBlur('campLocation')}
                      className={`border-red-200 focus:ring-red-500 ${touched.campLocation && errors.campLocation ? 'border-red-500' : ''}`}
                      placeholder="Enter venue address"
                    />
                    {renderError('campLocation')}
                  </div>
                  <div>
                    <Label className="text-red-700">Camp City</Label>
                    <Input
                      name="campCity"
                      value={formData.campCity}
                      onChange={handleChange}
                      onBlur={() => handleBlur('campCity')}
                      className={`border-red-200 focus:ring-red-500 ${touched.campCity && errors.campCity ? 'border-red-500' : ''}`}
                      placeholder="Enter city"
                    />
                    {renderError('campCity')}
                  </div>
                  <div>
                    <Label className="text-red-700">Camp State</Label>
                    <Select 
                      name="campState" 
                      value={formData.campState} 
                      onValueChange={(value) => handleSelectChange('campState', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.campState && errors.campState ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state, idx) => (
                          <SelectItem key={idx} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderError('campState')}
                  </div>
                  <div>
                    <Label className="text-red-700">Camp Country</Label>
                    <Select 
                      name="campCountry" 
                      value={formData.campCountry} 
                      onValueChange={(value) => handleSelectChange('campCountry', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.campCountry && errors.campCountry ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError('campCountry')}
                  </div>
                  <div>
                    <Label className="text-red-700">Camp Description</Label>
                    <Textarea
                      name="campDescription"
                      value={formData.campDescription}
                      onChange={handleChange}
                      onBlur={() => handleBlur('campDescription')}
                      className={`border-red-200 focus:ring-red-500 ${touched.campDescription && errors.campDescription ? 'border-red-500' : ''}`}
                      placeholder="Provide details about the camp"
                    />
                    {renderError('campDescription')}
                  </div>
                </div>
              )}

              {currentStep === steps.length - 1 && (
                <div className="bg-gray-100 p-4 rounded-md">
                  <h2 className="text-lg font-bold text-red-700 mb-2">Review Your Information:</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-red-600">Organizer Name:</div>
                    <div className="text-red-900">{formData.organizerName}</div>
                    
                    <div className="text-red-600">Organizer Email:</div>
                    <div className="text-red-900">{formData.organizerEmail}</div>
                    
                    <div className="text-red-600">Organizer Mobile:</div>
                    <div className="text-red-900">{formData.organizerMobile}</div>
                    
                    <div className="text-red-600">Camp Name:</div>
                    <div className="text-red-900">{formData.campName}</div>
                    
                    <div className="text-red-600">Camp Date:</div>
                    <div className="text-red-900">{formData.campDate}</div>
                    
                    <div className="text-red-600">Camp Location:</div>
                    <div className="text-red-900">{formData.campLocation}</div>
                    
                    <div className="text-red-600">Camp City:</div>
                    <div className="text-red-900">{formData.campCity}</div>
                    
                    <div className="text-red-600">Camp State:</div>
                    <div className="text-red-900">{formData.campState}</div>
                    
                    <div className="text-red-600">Camp Country:</div>
                    <div className="text-red-900">{formData.campCountry}</div>
                    
                    <div className="text-red-600">Camp Description:</div>
                    <div className="text-red-900">{formData.campDescription}</div>
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
                    type="button"
                    onClick={handleSubmit}
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
  );
};

export default HostBloodCamp;
