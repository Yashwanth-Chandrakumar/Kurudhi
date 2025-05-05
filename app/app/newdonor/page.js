'use client'
import Navbar from '@/components/Navbar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { initializeApp } from 'firebase/app';
import {
    addDoc,
    collection,
    getDocs,
    getFirestore,
    query,
    where
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const tamilNaduCities = [
  "Ambur",
  "Arakkonam",
  "Ariyalur",
  "Aruppukkottai",
  "Attur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Cumbum",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Gudiyatham",
  "Hosur",
  "Kanchipuram",
  "Karaikudi",
  "Karur",
  "Kanyakumari",
  "Kovilpatti",
  "Krishnagiri",
  "Kumbakonam",
  "Madurai",
  "Mayiladuthurai",
  "Mettupalayam",
  "Nagapattinam",
  "Namakkal",
  "Nagercoil",
  "Neyveli",
  "Ooty",
  "Palani",
  "Paramakudi",
  "Perambalur",
  "Pollachi",
  "Pudukottai",
  "Rajapalayam",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivagangai",
  "Sivakasi",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tirupattur",
  "Tiruchendur",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Tuticorin",
  "Udumalaipettai",
  "Valparai",
  "Vandavasi",
  "Vellore",
  "Viluppuram",
  "Virudhunagar"
];

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
);

export default function BecomeDonor() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    email: '',
    mobile: '',
    whatsapp: '',
    country: 'India',
    state: 'Tamil Nadu', // Fixed state
    permanentCity: '',
    residentCity: '',
    sameAsPermenant: false,
    acceptTerms: false,
    dateOfBirth: '',
  });

  // If the user is logged in, set the email in the form data.
  useEffect(() => {
    if(user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // Check if the user is an existing donor. If so, route to /dashboard.
  useEffect(() => {
    if(user?.email) {
      const checkExistingDonor = async () => {
        const db = getFirestore(initializeApp(firebaseConfig));
        const donorsRef = collection(db, 'donors');
        const q = query(donorsRef, where('Email', '==', user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // User is already a donor, redirect them.
          router.push('/dashboard');
        }
      };
      checkExistingDonor();
    }
  }, [user, router]);

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const steps = ['Personal Details', 'Contact Info', 'City Info', 'Confirmation'];
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Validation functions
  const getValidationErrors = (step) => {
    const newErrors = {};

    switch (step) {
      case 0:
        if (!formData.name) {
          newErrors.name = 'Name is required';
        } else {
          const error = validateField('name', formData.name);
          if (error) newErrors.name = error;
        }
        if (!formData.age) {
          newErrors.age = 'Age is required';
        } else {
          const error = validateField('age', formData.age);
          if (error) newErrors.age = error;
        }
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of Birth is required';
        } else {
          const error = validateField('dateOfBirth', formData.dateOfBirth);
          if (error) newErrors.dateOfBirth = error;
        }
        if (!formData.gender) newErrors.gender = 'Please select gender';
        if (!formData.bloodGroup) newErrors.bloodGroup = 'Please select blood group';
        break;

      case 1:
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else {
          const error = validateField('email', formData.email);
          if (error) newErrors.email = error;
        }
        if (!formData.mobile) {
          newErrors.mobile = 'Mobile number is required';
        } else {
          const error = validateField('mobile', formData.mobile);
          if (error) newErrors.mobile = error;
        }
        if (!formData.whatsapp) {
          newErrors.whatsapp = 'WhatsApp number is required';
        } else {
          const error = validateField('whatsapp', formData.whatsapp);
          if (error) newErrors.whatsapp = error;
        }
        break;

      case 2:
        if (!formData.permanentCity) newErrors.permanentCity = 'Permanent city is required';
        if (!formData.sameAsPermenant && !formData.residentCity) newErrors.residentCity = 'Resident city is required';
        break;

      case 3:
        if (!formData.acceptTerms) newErrors.acceptTerms = 'Please accept the terms and conditions';
        break;

      default:
        break;
    }
    return newErrors;
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim().length < 2 
          ? 'Name must be at least 2 characters long'
          : !/^[a-zA-Z\s]*$/.test(value) 
          ? 'Name can only contain letters and spaces'
          : '';
      case 'age':
        return !value 
          ? 'Age is required'
          : value < 18 || value > 65 
          ? 'Age must be between 18 and 65'
          : '';
      case 'dateOfBirth':
        if (!value) return 'Date of Birth is required';
        const dobDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();
        const isBeforeBirthday = today.getMonth() < dobDate.getMonth() || 
                               (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate());
        const calculatedAge = isBeforeBirthday ? age - 1 : age;
        return calculatedAge < 18 || calculatedAge > 65 
          ? 'Age must be between 18 and 65'
          : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
          ? 'Please enter a valid email address'
          : '';
      case 'mobile':
      case 'whatsapp':
        return !/^[6-9]\d{9}$/.test(value) 
          ? 'Please enter a valid 10-digit Indian mobile number'
          : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (type !== 'checkbox') {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: !value ? `Please select ${name}` : '' }));
  };

  const handleAddressCheckbox = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsPermenant: checked,
      residentCity: checked ? prev.permanentCity : ''
    }));
  };

  const validateStep = (step) => {
    const newErrors = getValidationErrors(step);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = () => {
    const currentErrors = getValidationErrors(currentStep);
    return Object.keys(currentErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setSubmitStatus({ type: '', message: '' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setSubmitStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep) || submitting) return;
    
    try {
      setSubmitting(true);
      setSubmitStatus({ type: 'info', message: 'Submitting your registration...' });
      const donorData = {
        Age: parseInt(formData.age),
        BloodGroup: formData.bloodGroup,
        Country: formData.country,
        Email: formData.email,
        Gender: formData.gender,
        MobileNumber: formData.mobile,
        Name: formData.name,
        PermanentCity: formData.permanentCity,
        ResidentCity: formData.residentCity || formData.permanentCity,
        State: formData.state,
        WhatsappNumber: formData.whatsapp,
        DateOfBirth: formData.dateOfBirth,
        registeredAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'donors'), donorData);
      setSubmitStatus({
        type: 'success',
        message: 'Thank you for registering as a blood donor! Your registration has been successful.'
      });
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error adding donor: ', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit registration. Please try again later.'
      });
      setSubmitting(false);
    }
  };

  const renderFieldError = (fieldName) => {
    return errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  return (
    <>
      <Navbar/>
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
            Become a Blood Donor
          </h1>
          
          {submitStatus.message && (
            <Alert className={`mb-4 ${
              submitStatus.type === 'success' ? 'bg-green-50 border-green-200' :
              submitStatus.type === 'error' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <AlertDescription className={`${
                submitStatus.type === 'success' ? 'text-green-800' :
                submitStatus.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {submitStatus.message}
              </AlertDescription>
            </Alert>
          )}

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
                          className={`border-red-200 focus:ring-red-500 ${
                            errors[field] ? 'border-red-500' : ''
                          }`}
                          placeholder={`Enter your ${field}`}
                        />
                        {renderFieldError(field)}
                      </div>
                    ))}
                    
                    <div>
                      <Label className="text-red-700">Date of Birth</Label>
                      <Input
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className={`border-red-200 focus:ring-red-500 ${
                          errors.dateOfBirth ? 'border-red-500' : ''
                        }`}
                      />
                      {renderFieldError('dateOfBirth')}
                    </div>
                    
                    {['gender', 'bloodGroup'].map(field => (
                      <div key={field}>
                        <Label className="text-red-700">
                          {field === 'bloodGroup' ? 'Blood Group' : 'Gender'}
                        </Label>
                        <Select
                          name={field}
                          value={formData[field]}
                          onValueChange={(value) => handleSelectChange(field, value)}
                        >
                          <SelectTrigger className={`border-red-200 ${
                            errors[field] ? 'border-red-500' : ''
                          }`}>
                            <SelectValue placeholder={`Select ${field === 'bloodGroup' ? 'blood group' : field}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field === 'gender' 
                              ? ['male', 'female', 'other'].map(value => (
                                  <SelectItem key={value} value={value} className="capitalize">
                                    {value}
                                  </SelectItem>
                                ))
                              : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(value => (
                                  <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                        {renderFieldError(field)}
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
                          className={`border-red-200 focus:ring-red-500 ${
                            errors[field] ? 'border-red-500' : ''
                          }`}
                          placeholder={`Enter your ${field}`}
                          disabled={field === 'email'}
                        />
                        {renderFieldError(field)}
                      </div>
                    ))}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-red-700 capitalize">Country</Label>
                      <Select name="country" value="India">
                        <SelectTrigger className="border-red-200">
                          <SelectValue placeholder="India" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India" className="capitalize">
                            India
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-red-700 capitalize">State</Label>
                      <Input
                        value="Tamil Nadu"
                        disabled
                        className="bg-gray-100 border-red-200"
                      />
                    </div>

                    <div>
                      <Label className="text-red-700">Permanent City</Label>
                      <Select
                        name="permanentCity"
                        value={formData.permanentCity}
                        onValueChange={(value) => handleSelectChange("permanentCity", value)}
                      >
                        <SelectTrigger className={`border-red-200 ${errors.permanentCity ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select your permanent city" />
                        </SelectTrigger>
                        <SelectContent>
                          {tamilNaduCities.map((city) => (
                            <SelectItem key={city} value={city} className="capitalize">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderFieldError('permanentCity')}
                    </div>

                    <div>
                      <Label className="text-red-700">Resident City</Label>
                      <Select
                        name="residentCity"
                        value={formData.residentCity}
                        onValueChange={(value) => handleSelectChange("residentCity", value)}
                      >
                        <SelectTrigger className={`border-red-200 ${errors.residentCity ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select your resident city" />
                        </SelectTrigger>
                        <SelectContent>
                          {tamilNaduCities.map((city) => (
                            <SelectItem key={city} value={city} className="capitalize">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderFieldError('residentCity')}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAddress"
                        checked={formData.sameAsPermenant}
                        onCheckedChange={handleAddressCheckbox}
                        className="border-red-200 data-[state=checked]:bg-red-600"
                      />
                      <Label htmlFor="sameAddress" className="text-red-700">
                        Same as permanent city
                      </Label>
                    </div>
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
                    {renderFieldError('acceptTerms')}

                    {formData.acceptTerms && (
                      <div className="mt-6 space-y-4 bg-red-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-red-800">Please review your information:</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-red-600">Name:</div>
                          <div className="text-red-900">{formData.name}</div>
                          <div className="text-red-600">Age:</div>
                          <div className="text-red-900">{formData.age}</div>
                          <div className="text-red-600">Date of Birth:</div>
                          <div className="text-red-900">{formData.dateOfBirth}</div>
                          <div className="text-red-600">Blood Group:</div>
                          <div className="text-red-900">{formData.bloodGroup}</div>
                          <div className="text-red-600">Gender:</div>
                          <div className="text-red-900 capitalize">{formData.gender}</div>
                          <div className="text-red-600">Email:</div>
                          <div className="text-red-900">{formData.email}</div>
                          <div className="text-red-600">Mobile:</div>
                          <div className="text-red-900">{formData.mobile}</div>
                          <div className="text-red-600">WhatsApp:</div>
                          <div className="text-red-900">{formData.whatsapp}</div>
                          <div className="text-red-600">State:</div>
                          <div className="text-red-900">Tamil Nadu</div>
                          <div className="text-red-600">Permanent City:</div>
                          <div className="text-red-900">{formData.permanentCity}</div>
                          <div className="text-red-600">Resident City:</div>
                          <div className="text-red-900">{formData.residentCity || formData.permanentCity}</div>
                        </div>
                      </div>
                    )}
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
                      disabled={!isStepValid() || submitting || submitStatus.type === 'info'}
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
    </>
  );
}
