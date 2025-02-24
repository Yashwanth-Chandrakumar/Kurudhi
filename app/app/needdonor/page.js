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
import CryptoJS from "crypto-js";
import Navbar from '@/components/Navbar';

const SECRET_KEY = process.env.NEXT_PUBLIC_UUID_SECRET || "default_secret_key";
const indianStates = [
  "Tamil Nadu"
];
const tamilNaduCities = [
  "Ambur",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dindigul",
  "Erode",
  "Hosur",
  "Kanchipuram",
  "Karaikkudi",
  "Kanyakumari",
  "Kumbakonam",
  "Kovilpatti",
  "Madurai",
  "Nagapattinam",
  "Nagercoil",
  "Neyveli",
  "Rajapalayam",
  "Salem",
  "Thanjavur",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tiruppur",
  "Tiruvannamalai",
  "Vellore",
  "Viluppuram",
  "Virudhunagar"
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

// Validation rules
const validationRules = {
  patientName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: 'Patient name is required',
      minLength: 'Name must be at least 2 characters long',
      maxLength: 'Name must be less than 50 characters',
      pattern: 'Name can only contain letters and spaces'
    }
  },
  age: {
    required: true,
    min: 0,
    max: 120,
    pattern: /^\d+$/,
    message: {
      required: 'Age is required',
      min: 'Age must be greater than 0',
      max: 'Age must be less than 120',
      pattern: 'Age must be a valid number'
    }
  },
  gender: {
    required: true,
    enum: ['male', 'female', 'other'],
    message: {
      required: 'Gender is required',
      enum: 'Please select a valid gender'
    }
  },
  reasonForBlood: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: {
      required: 'Reason for blood requirement is required',
      minLength: 'Please provide a detailed reason (minimum 10 characters)',
      maxLength: 'Reason must be less than 500 characters'
    }
  },
  bloodGroup: {
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    message: {
      required: 'Blood group is required',
      enum: 'Please select a valid blood group'
    }
  },
  unitsNeeded: {
    required: true,
    min: 1,
    max: 10,
    pattern: /^\d+$/,
    message: {
      required: 'Units needed is required',
      min: 'Minimum 1 unit is required',
      max: 'Maximum 10 units can be requested',
      pattern: 'Units must be a valid number'
    }
  },
  hospital: {
    required: true,
    minLength: 3,
    maxLength: 100,
    message: {
      required: 'Hospital name is required',
      minLength: 'Hospital name must be at least 3 characters long',
      maxLength: 'Hospital name must be less than 100 characters'
    }
  },
  attenderName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: 'Attender name is required',
      minLength: 'Name must be at least 2 characters long',
      maxLength: 'Name must be less than 50 characters',
      pattern: 'Name can only contain letters and spaces'
    }
  },
  attenderMobile: {
    required: true,
    pattern: /^[0-9]{10}$/,
    message: {
      required: 'Mobile number is required',
      pattern: 'Please enter a valid 10-digit mobile number'
    }
  },
  country: {
    required: true,
    enum: ['india'],
    message: {
      required: 'Country is required',
      enum: 'Please select a valid country'
    }
  },
  state: {
    required: true,
    enum: indianStates,
    message: {
      required: 'State is required',
      enum: 'Please select a valid state'
    }
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: 'City is required',
      minLength: 'City name must be at least 2 characters long',
      maxLength: 'City name must be less than 50 characters',
      pattern: 'City name can only contain letters and spaces'
    }
  }
};

// Validation function
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
  );
};

const RequestDonor = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
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
    country: 'india',
    state: '',
    city: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  // Final review step added
  const steps = ['Patient Details', 'Medical Info', 'Contact Details', 'Review & Confirm'];

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

  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return ['patientName', 'age', 'gender'];
      case 1:
        return ['reasonForBlood', 'bloodGroup', 'unitsNeeded', 'hospital'];
      case 2:
        return ['attenderName', 'attenderMobile', 'country', 'state', 'city'];
      default:
        return [];
    }
  };

  // For review step, we simply allow submission.
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

  // Called explicitly on clicking "Submit Request" on the review page.
  const handleSubmit = async () => {
    const allFields = [
      ...getStepFields(0),
      ...getStepFields(1),
      ...getStepFields(2)
    ];
    const formErrors = validateForm(formData, allFields);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const encryptedUUID = localStorage.getItem("userUUID");
      let uuid = '';
      if (encryptedUUID) {
        // Decrypt the encrypted UID using the same secret key
        const bytes = CryptoJS.AES.decrypt(encryptedUUID, SECRET_KEY);
        uuid = bytes.toString(CryptoJS.enc.Utf8);
      }
      const requestData = {
        uuid, // <-- Include the decrypted UUID
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

      const docRef = await addDoc(collection(db, 'requests'), requestData);
      console.log('Blood request registered with ID: ', docRef.id);
      
      setSubmitStatus({
        type: 'success',
        message: 'Your blood request has been submitted successfully!'
      });
      
      setTimeout(() => {
        router.push("/");
      }, 2000);

      // (Optional) Reset form fields if desired.
      // setFormData({ ... });
      // setCurrentStep(0);
      // setErrors({});
      // setTouched({});
      
    } catch (error) {
      console.error('Error adding request: ', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit. Please try again.'
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
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
          Blood Donation Request
        </h1>
        
        {/* Display submit status message if available */}
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
                    <Label className="text-red-700">Patient Name</Label>
                    <Input
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('patientName')}
                      className={`border-red-200 focus:ring-red-500 ${touched.patientName && errors.patientName ? 'border-red-500' : ''}`}
                      placeholder="Enter patient's full name"
                    />
                    {renderError('patientName')}
                  </div>
                  <div>
                    <Label className="text-red-700">Age</Label>
                    <Input
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      onBlur={() => handleBlur('age')}
                      className={`border-red-200 focus:ring-red-500 ${touched.age && errors.age ? 'border-red-500' : ''}`}
                      placeholder="Enter patient's age"
                    />
                    {renderError('age')}
                  </div>
                  <div>
                    <Label className="text-red-700">Gender</Label>
                    <Select 
                      name="gender" 
                      value={formData.gender} 
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.gender && errors.gender ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError('gender')}
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
                      onBlur={() => handleBlur('reasonForBlood')}
                      className={`border-red-200 focus:ring-red-500 ${touched.reasonForBlood && errors.reasonForBlood ? 'border-red-500' : ''}`}
                      placeholder="Please specify the reason"
                    />
                    {renderError('reasonForBlood')}
                  </div>
                  <div>
                    <Label className="text-red-700">Blood Group Required</Label>
                    <Select 
                      name="bloodGroup" 
                      value={formData.bloodGroup} 
                      onValueChange={(value) => handleSelectChange('bloodGroup', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.bloodGroup && errors.bloodGroup ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderError('bloodGroup')}
                  </div>
                  <div>
                    <Label className="text-red-700">Units Required</Label>
                    <Input
                      name="unitsNeeded"
                      type="number"
                      min="1"
                      value={formData.unitsNeeded}
                      onChange={handleChange}
                      onBlur={() => handleBlur('unitsNeeded')}
                      className={`border-red-200 focus:ring-red-500 ${touched.unitsNeeded && errors.unitsNeeded ? 'border-red-500' : ''}`}
                      placeholder="Enter units needed"
                    />
                    {renderError('unitsNeeded')}
                  </div>
                  <div>
                    <Label className="text-red-700">Hospital Name</Label>
                    <Input
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleChange}
                      onBlur={() => handleBlur('hospital')}
                      className={`border-red-200 focus:ring-red-500 ${touched.hospital && errors.hospital ? 'border-red-500' : ''}`}
                      placeholder="Enter hospital name"
                    />
                    {renderError('hospital')}
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
                      onBlur={() => handleBlur('attenderName')}
                      className={`border-red-200 focus:ring-red-500 ${touched.attenderName && errors.attenderName ? 'border-red-500' : ''}`}
                      placeholder="Enter attender's name"
                    />
                    {renderError('attenderName')}
                  </div>
                  <div>
                    <Label className="text-red-700">Attender Number</Label>
                    <Input
                      name="attenderMobile"
                      type="tel"
                      value={formData.attenderMobile}
                      onChange={handleChange}
                      onBlur={() => handleBlur('attenderMobile')}
                      className={`border-red-200 focus:ring-red-500 ${touched.attenderMobile && errors.attenderMobile ? 'border-red-500' : ''}`}
                      placeholder="Enter mobile number"
                    />
                    {renderError('attenderMobile')}
                  </div>
                  <div>
                    <Label className="text-red-700">Country</Label>
                    <Select 
                      name="country" 
                      value={formData.country} 
                      onValueChange={(value) => handleSelectChange('country', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.country && errors.country ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError('country')}
                  </div>
                  <div>
                    <Label className="text-red-700">State</Label>
                    <Select 
                      name="state" 
                      value={formData.state} 
                      onValueChange={(value) => handleSelectChange('state', value)}
                    >
                      <SelectTrigger className={`border-red-200 ${touched.state && errors.state ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state, idx) => (
                          <SelectItem key={idx} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderError('state')}
                  </div>
                  <div>
                    <Label className="text-red-700">City</Label>
                    {formData.state === "Tamil Nadu" ? (
        <Select 
          name="city" 
          value={formData.city} 
          onValueChange={(value) => handleSelectChange('city', value)}
        >
          <SelectTrigger className={`border-red-200 ${touched.city && errors.city ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {tamilNaduCities.map((city, idx) => (
              <SelectItem key={idx} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          name="city"
          value={formData.city}
          onChange={handleChange}
          onBlur={() => handleBlur('city')}
          className={`border-red-200 focus:ring-red-500 ${touched.city && errors.city ? 'border-red-500' : ''}`}
          placeholder="Enter city name"
        />
      )}
      {renderError('city')}
                  </div>
                </div>
              )}

              {currentStep === steps.length - 1 && (
                <div className="bg-gray-100 p-4 rounded-md">
                  <h2 className="text-lg font-bold text-red-700 mb-2">
                    Please review your information:
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-red-600">Patient Name:</div>
                    <div className="text-red-900">{formData.patientName}</div>
                    
                    <div className="text-red-600">Age:</div>
                    <div className="text-red-900">{formData.age}</div>
                    
                    <div className="text-red-600">Gender:</div>
                    <div className="text-red-900 capitalize">{formData.gender}</div>
                    
                    <div className="text-red-600">Reason:</div>
                    <div className="text-red-900">{formData.reasonForBlood}</div>
                    
                    <div className="text-red-600">Blood Group:</div>
                    <div className="text-red-900">{formData.bloodGroup}</div>
                    
                    <div className="text-red-600">Units Needed:</div>
                    <div className="text-red-900">{formData.unitsNeeded}</div>
                    
                    <div className="text-red-600">Hospital:</div>
                    <div className="text-red-900">{formData.hospital}</div>
                    
                    <div className="text-red-600">Attender Name:</div>
                    <div className="text-red-900">{formData.attenderName}</div>
                    
                    <div className="text-red-600">Attender Mobile:</div>
                    <div className="text-red-900">{formData.attenderMobile}</div>
                    
                    <div className="text-red-600">Country:</div>
                    <div className="text-red-900">{formData.country}</div>
                    
                    <div className="text-red-600">State:</div>
                    <div className="text-red-900">{formData.state}</div>
                    
                    <div className="text-red-600">City:</div>
                    <div className="text-red-900">{formData.city}</div>
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
    </>
  );
};

export default RequestDonor;
