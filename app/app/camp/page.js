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

/* 
  Define validation rules for the hosted blood camp form.
  Note: We are using a separate rules object for the camp form.
*/
const hostCampValidationRules = {
    organizationType: {
      required: true,
      message: { required: 'Organization type is required' }
    },
    organizationName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: {
        required: 'Organization name is required',
        minLength: 'Organization name must be at least 2 characters long',
        maxLength: 'Organization name must be less than 100 characters'
      }
    },
    organizerName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s]*$/,
      message: {
        required: 'Organizer name is required',
        minLength: 'Organizer name must be at least 2 characters long',
        maxLength: 'Organizer name must be less than 50 characters',
        pattern: 'Organizer name can only contain letters and spaces'
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
    organizerEmail: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: {
        required: 'Email is required',
        pattern: 'Enter a valid email address'
      }
    },
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
    campStart: {
      required: true,
      message: { required: 'Camp start date & time is required' }
    },
    campEnd: {
      required: true,
      message: { required: 'Camp end date & time is required' }
    },
    targetBloodUnits: {
      required: true,
      pattern: /^[0-9]+$/,
      message: {
        required: 'Target blood units is required',
        pattern: 'Enter a valid number'
      }
    },
    alternativeContact: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: {
        required: 'Alternative contact is required',
        pattern: 'Enter a valid 10-digit number'
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
// Validate a single field against the host camp rules.
const validateHostCampField = (name, value) => {
  const fieldRules = hostCampValidationRules[name];
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
    if (fieldRules.enum && !fieldRules.enum.includes(value)) {
      return fieldRules.message.enum;
    }
  }
  return '';
};

// A simple stepper component to indicate progress.
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
    organizationType: '',
    organizationName: '',
    organizerName: '',
    organizerMobile: '',
    organizerEmail: '',
    // Step 2: Camp Details (modified fields)
    campName: '',
    campLocation: '',
    campCity: '',
    campState: '',
    campCountry: 'india',
    campStart: '',  // "datetime-local" format
    campEnd: '',    // "datetime-local" format
    targetBloodUnits: '',
    alternativeContact: '',
    campDescription: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const steps = ['Organizer Details', 'Camp Details', 'Review & Confirm'];

  // Validate a set of fields.
  const validateForm = (data, fields) => {
    const newErrors = {};
    fields.forEach(field => {
      const error = validateHostCampField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateHostCampField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateHostCampField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateHostCampField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  // Fields per step.
  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return ['organizationType', 'organizationName', 'organizerName', 'organizerMobile', 'organizerEmail'];
      case 1:
        return [
          'campName', 'campLocation', 'campCity', 'campState', 'campCountry',
          'campStart', 'campEnd', 'targetBloodUnits', 'alternativeContact', 'campDescription'
        ];
      default:
        return [];
    }
  };

  // For review step, simply allow submission.
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
    };
  
    // Create Date objects directly from campStart and campEnd values.
    const campStart = new Date(formData.campStart);
    const campEnd = new Date(formData.campEnd);
    const now = new Date();
    let campStatus = '';
    if (campStart > now) {
      campStatus = 'upcoming';
    } else if (campStart <= now && campEnd >= now) {
      campStatus = 'ongoing';
    } else {
      campStatus = 'completed';
    }
  
    try {
      const campData = {
        OrganizationType: formData.organizationType,
        OrganizationName: formData.organizationName,
        OrganizerName: formData.organizerName,
        OrganizerMobile: formData.organizerMobile,
        OrganizerEmail: formData.organizerEmail,
        CampName: formData.campName,
        CampLocation: formData.campLocation,
        CampCity: formData.campCity,
        CampState: formData.campState,
        CampCountry: formData.campCountry,
        CampStart: formData.campStart,   // Full date–time value
        CampEnd: formData.campEnd,       // Full date–time value
        TargetBloodUnits: parseInt(formData.targetBloodUnits),
        AlternativeContact: formData.alternativeContact,
        CampDescription: formData.campDescription,
        CampStatus: campStatus,
        CreatedAt: new Date().toISOString()
      };
  
      const docRef = await addDoc(collection(db, 'camps'), campData);
      console.log('Blood camp hosted with ID: ', docRef.id);
      setSubmitStatus({
        type: 'success',
        message: 'Your blood camp has been hosted successfully!'
      });
  
      setTimeout(() => {
        router.push("/admin");
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
                    <Label className="text-red-700">Organization Type</Label>
                    <Select 
                      name="organizationType" 
                      value={formData.organizationType} 
                      onValueChange={(value) => handleSelectChange('organizationType', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.organizationType && errors.organizationType ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rotary">Rotary</SelectItem>
                        <SelectItem value="Rotaract">Rotaract</SelectItem>
                        <SelectItem value="NGO">NGO</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError('organizationType')}
                  </div>
                  <div>
                    <Label className="text-red-700">Organization Name</Label>
                    <Input
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('organizationName')}
                      className={`border-red-200 focus:ring-red-500 ${touched.organizationName && errors.organizationName ? 'border-red-500' : ''}`}
                      placeholder="Enter organization name"
                    />
                    {renderError('organizationName')}
                  </div>
                  <div>
                    <Label className="text-red-700">Organizer Name</Label>
                    <Input
                      name="organizerName"
                      value={formData.organizerName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('organizerName')}
                      className={`border-red-200 focus:ring-red-500 ${touched.organizerName && errors.organizerName ? 'border-red-500' : ''}`}
                      placeholder="Enter organizer name"
                    />
                    {renderError('organizerName')}
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
                      placeholder="Enter organizer mobile number"
                    />
                    {renderError('organizerMobile')}
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
                      placeholder="Enter organizer email"
                    />
                    {renderError('organizerEmail')}
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
      <Label className="text-red-700">Camp Location</Label>
      <Input
        name="campLocation"
        value={formData.campLocation}
        onChange={handleChange}
        onBlur={() => handleBlur('campLocation')}
        className={`border-red-200 focus:ring-red-500 ${touched.campLocation && errors.campLocation ? 'border-red-500' : ''}`}
        placeholder="Enter camp venue address"
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
      <Label className="text-red-700">Camp Start (Date & Time)</Label>
      <Input
        name="campStart"
        type="datetime-local"
        value={formData.campStart}
        onChange={handleChange}
        onBlur={() => handleBlur('campStart')}
        className={`border-red-200 focus:ring-red-500 ${touched.campStart && errors.campStart ? 'border-red-500' : ''}`}
      />
      {renderError('campStart')}
    </div>
    <div>
      <Label className="text-red-700">Camp End (Date & Time)</Label>
      <Input
        name="campEnd"
        type="datetime-local"
        value={formData.campEnd}
        onChange={handleChange}
        onBlur={() => handleBlur('campEnd')}
        className={`border-red-200 focus:ring-red-500 ${touched.campEnd && errors.campEnd ? 'border-red-500' : ''}`}
      />
      {renderError('campEnd')}
    </div>
    <div>
      <Label className="text-red-700">Target Blood Units</Label>
      <Input
        name="targetBloodUnits"
        type="number"
        value={formData.targetBloodUnits}
        onChange={handleChange}
        onBlur={() => handleBlur('targetBloodUnits')}
        className={`border-red-200 focus:ring-red-500 ${touched.targetBloodUnits && errors.targetBloodUnits ? 'border-red-500' : ''}`}
        placeholder="Enter target blood units"
      />
      {renderError('targetBloodUnits')}
    </div>
    <div>
      <Label className="text-red-700">Alternative Contact Number</Label>
      <Input
        name="alternativeContact"
        type="tel"
        value={formData.alternativeContact}
        onChange={handleChange}
        onBlur={() => handleBlur('alternativeContact')}
        className={`border-red-200 focus:ring-red-500 ${touched.alternativeContact && errors.alternativeContact ? 'border-red-500' : ''}`}
        placeholder="Enter alternative 10-digit mobile number"
      />
      {renderError('alternativeContact')}
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
                    <div className="text-red-600">Organization Type:</div>
                    <div className="text-red-900">{formData.organizationType}</div>
                    
                    <div className="text-red-600">Organization Name:</div>
                    <div className="text-red-900">{formData.organizationName}</div>
                    
                    <div className="text-red-600">Organizer Name:</div>
                    <div className="text-red-900">{formData.organizerName}</div>
                    
                    <div className="text-red-600">Organizer Mobile:</div>
                    <div className="text-red-900">{formData.organizerMobile}</div>
                    
                    <div className="text-red-600">Organizer Email:</div>
                    <div className="text-red-900">{formData.organizerEmail}</div>
                    
                    <div className="text-red-600">Camp Name:</div>
                    <div className="text-red-900">{formData.campName}</div>
                    
                    <div className="text-red-600">Camp Location:</div>
                    <div className="text-red-900">{formData.campLocation}</div>
                    
                    <div className="text-red-600">Camp City:</div>
                    <div className="text-red-900">{formData.campCity}</div>
                    
                    <div className="text-red-600">Camp State:</div>
                    <div className="text-red-900">{formData.campState}</div>
                    
                    <div className="text-red-600">Camp Country:</div>
                    <div className="text-red-900">{formData.campCountry}</div>
                    
                    <div className="text-red-600">Camp Start:</div>
<div className="text-red-900">
  {new Date(formData.campStart).toLocaleString()}
</div>

<div className="text-red-600">Camp End:</div>
<div className="text-red-900">
  {new Date(formData.campEnd).toLocaleString()}
</div>



                    
                    <div className="text-red-600">Target Blood Units:</div>
                    <div className="text-red-900">{formData.targetBloodUnits}</div>
                    
                    <div className="text-red-600">Alternative Contact:</div>
                    <div className="text-red-900">{formData.alternativeContact}</div>
                    
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
