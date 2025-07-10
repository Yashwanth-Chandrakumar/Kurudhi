import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SECRET_KEY = "default_secret_key"; // Should be from env variables in production
const indianStates = ["Tamil Nadu"];
const tamilNaduCities = [
  "Ambur", "Arakkonam", "Ariyalur", "Aruppukkottai", "Attur", "Chengalpattu",
  "Chennai", "Coimbatore", "Cuddalore", "Cumbum", "Dharmapuri", "Dindigul",
  "Erode", "Gudiyatham", "Hosur", "Kanchipuram", "Karaikudi", "Karur",
  "Kanyakumari", "Kovilpatti", "Krishnagiri", "Kumbakonam", "Madurai",
  "Mayiladuthurai", "Mettupalayam", "Nagapattinam", "Namakkal", "Nagercoil",
  "Neyveli", "Ooty", "Palani", "Paramakudi", "Perambalur", "Pollachi",
  "Pudukottai", "Rajapalayam", "Ramanathapuram", "Ranipet", "Salem",
  "Sivagangai", "Sivakasi", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi",
  "Tirupattur", "Tiruchendur", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
  "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Tuticorin", "Udumalaipettai",
  "Valparai", "Vandavasi", "Vellore", "Viluppuram", "Virudhunagar"
];

const firebaseConfig = {
    apiKey: "AIzaSyD1n55zOb5xCWp3jS1mPRTwGWYx90rAzWE",
    authDomain: "kurudhi-3aec8.firebaseapp.com",
    projectId: "kurudhi-3aec8",
    storageBucket: "kurudhi-3aec8.firebasestorage.app",
    messagingSenderId: "936520747934",
    appId: "1:936520747934:web:c17cc5b4aa7ce54ca2248f",
    measurementId: "G-N7JGJTRDE7"
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

// Stepper Component
const Stepper = ({ steps, currentStep }) => {
  return (
    <View style={styles.stepperContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${(currentStep / (steps.length - 1)) * 100}%` }
          ]}
        />
      </View>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= currentStep ? styles.stepNumberActive : styles.stepNumberInactive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={styles.stepLabel}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Custom Checkbox Component
const Checkbox = ({ checked, onPress, label }) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxText}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

export const RequestDonor = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    reasonForBlood: '',
    bloodGroup: '',
    anyBloodGroupAccepted: false,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const steps = ['Patient Details', 'Medical Info', 'Contact Details', 'Review & Confirm'];

  const validateForm = (data, fields) => {
    const newErrors = {};
    fields.forEach(field => {
      if (field === 'bloodGroup' && data.anyBloodGroupAccepted) {
        return;
      }
      const error = validateField(field, data[field], validationRules);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value, validationRules);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name], validationRules);
    setErrors(prev => ({ ...prev, [name]: error }));
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

  const isStepValid = () => {
    if (currentStep === steps.length - 1) return true;
    const stepFields = getStepFields(currentStep);
    const stepErrors = validateForm(formData, stepFields);
    const hasErrors = Object.keys(stepErrors).length > 0;
    
    if (currentStep === 1) {
      const allFieldsFilled = stepFields.every(field => {
        if (field === 'bloodGroup' && formData.anyBloodGroupAccepted) {
          return true;
        }
        return formData[field];
      });
      return !hasErrors && allFieldsFilled;
    }
    
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

    setIsSubmitting(true);

    try {
      const encryptedUUID = await AsyncStorage.getItem("userUUID");
      let uuid = '';
      if (encryptedUUID) {
        const bytes = CryptoJS.AES.decrypt(encryptedUUID, SECRET_KEY);
        uuid = bytes.toString(CryptoJS.enc.Utf8);
      }

      const requestData = {
        uuid,
        AttenderName: formData.attenderName,
        AttenderMobile: parseInt(formData.attenderMobile),
        BloodGroup: formData.bloodGroup,
        AnyBloodGroupAccepted: formData.anyBloodGroupAccepted,
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
      
      Alert.alert(
        'Success',
        'Your blood request has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('home')
          }
        ]
      );

    } catch (error) {
      console.error('Error adding request: ', error);
      Alert.alert('Error', 'Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderError = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <Text style={styles.errorText}>{errors[fieldName]}</Text>
      );
    }
    return null;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Patient Name</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.patientName && errors.patientName && styles.inputError
                ]}
                value={formData.patientName}
                onChangeText={(value) => handleChange('patientName', value)}
                onBlur={() => handleBlur('patientName')}
                placeholder="Enter patient's full name"
                placeholderTextColor="#999"
              />
              {renderError('patientName')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.age && errors.age && styles.inputError
                ]}
                value={formData.age}
                onChangeText={(value) => handleChange('age', value)}
                onBlur={() => handleBlur('age')}
                placeholder="Enter patient's age"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {renderError('age')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={[
                styles.pickerContainer,
                touched.gender && errors.gender && styles.inputError
              ]}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
              {renderError('gender')}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Reason for Blood Requirement</Text>
              <TextInput
                style={[
                  styles.textArea,
                  touched.reasonForBlood && errors.reasonForBlood && styles.inputError
                ]}
                value={formData.reasonForBlood}
                onChangeText={(value) => handleChange('reasonForBlood', value)}
                onBlur={() => handleBlur('reasonForBlood')}
                placeholder="Please specify the reason"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
              {renderError('reasonForBlood')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Blood Group Required</Text>
              <View style={[
                styles.pickerContainer,
                touched.bloodGroup && errors.bloodGroup && !formData.anyBloodGroupAccepted && styles.inputError
              ]}>
                <Picker
                  selectedValue={formData.bloodGroup}
                  onValueChange={(value) => handleChange('bloodGroup', value)}
                  style={styles.picker}
                  enabled={!formData.anyBloodGroupAccepted}
                >
                  <Picker.Item label="Select blood group" value="" />
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
              {renderError('bloodGroup')}
              
              <Checkbox
                checked={formData.anyBloodGroupAccepted}
                onPress={() => handleChange('anyBloodGroupAccepted', !formData.anyBloodGroupAccepted)}
                label="Any blood group is preferred (for dialysis, etc.)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Units Required</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.unitsNeeded && errors.unitsNeeded && styles.inputError
                ]}
                value={formData.unitsNeeded}
                onChangeText={(value) => handleChange('unitsNeeded', value)}
                onBlur={() => handleBlur('unitsNeeded')}
                placeholder="Enter units needed"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {renderError('unitsNeeded')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hospital Name</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.hospital && errors.hospital && styles.inputError
                ]}
                value={formData.hospital}
                onChangeText={(value) => handleChange('hospital', value)}
                onBlur={() => handleBlur('hospital')}
                placeholder="Enter hospital name"
                placeholderTextColor="#999"
              />
              {renderError('hospital')}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Attender Name</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.attenderName && errors.attenderName && styles.inputError
                ]}
                value={formData.attenderName}
                onChangeText={(value) => handleChange('attenderName', value)}
                onBlur={() => handleBlur('attenderName')}
                placeholder="Enter attender's name"
                placeholderTextColor="#999"
              />
              {renderError('attenderName')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Attender Number</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.attenderMobile && errors.attenderMobile && styles.inputError
                ]}
                value={formData.attenderMobile}
                onChangeText={(value) => handleChange('attenderMobile', value)}
                onBlur={() => handleBlur('attenderMobile')}
                placeholder="Enter mobile number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              {renderError('attenderMobile')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Country</Text>
              <View style={[
                styles.pickerContainer,
                touched.country && errors.country && styles.inputError
              ]}>
                <Picker
                  selectedValue={formData.country}
                  onValueChange={(value) => handleChange('country', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="India" value="india" />
                </Picker>
              </View>
              {renderError('country')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State</Text>
              <View style={[
                styles.pickerContainer,
                touched.state && errors.state && styles.inputError
              ]}>
                <Picker
                  selectedValue={formData.state}
                  onValueChange={(value) => handleChange('state', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select state" value="" />
                  {indianStates.map((state, idx) => (
                    <Picker.Item key={idx} label={state} value={state} />
                  ))}
                </Picker>
              </View>
              {renderError('state')}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              {formData.state === "Tamil Nadu" ? (
                <View style={[
                  styles.pickerContainer,
                  touched.city && errors.city && styles.inputError
                ]}>
                  <Picker
                    selectedValue={formData.city}
                    onValueChange={(value) => handleChange('city', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select city" value="" />
                    {tamilNaduCities.map((city, idx) => (
                      <Picker.Item key={idx} label={city} value={city} />
                    ))}
                  </Picker>
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.input,
                    touched.city && errors.city && styles.inputError
                  ]}
                  value={formData.city}
                  onChangeText={(value) => handleChange('city', value)}
                  onBlur={() => handleBlur('city')}
                  placeholder="Enter city name"
                  placeholderTextColor="#999"
                />
              )}
              {renderError('city')}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>Please review your information:</Text>
            <View style={styles.reviewContent}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Patient Name:</Text>
                <Text style={styles.reviewValue}>{formData.patientName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Age:</Text>
                <Text style={styles.reviewValue}>{formData.age}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Gender:</Text>
                <Text style={styles.reviewValue}>{formData.gender}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Reason:</Text>
                <Text style={styles.reviewValue}>{formData.reasonForBlood}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Blood Group:</Text>
                <Text style={styles.reviewValue}>
                  {formData.anyBloodGroupAccepted ? "Any blood group" : formData.bloodGroup}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Units Needed:</Text>
                <Text style={styles.reviewValue}>{formData.unitsNeeded}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Hospital:</Text>
                <Text style={styles.reviewValue}>{formData.hospital}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Attender Name:</Text>
                <Text style={styles.reviewValue}>{formData.attenderName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Attender Mobile:</Text>
                <Text style={styles.reviewValue}>{formData.attenderMobile}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Country:</Text>
                <Text style={styles.reviewValue}>{formData.country}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>State:</Text>
                <Text style={styles.reviewValue}>{formData.state}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>City:</Text>
                <Text style={styles.reviewValue}>{formData.city}</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Blood Donation Request</Text>
        </View>

        <View style={styles.card}>
          <Stepper steps={steps} currentStep={currentStep} />
          {renderStep()}

          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.previousButton}
                onPress={handlePrevious}
              >
                <Text style={styles.previousButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < steps.length - 1 ? (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isStepValid() && styles.disabledButton
                ]}
                onPress={handleNext}
                disabled={!isStepValid()}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isStepValid() || isSubmitting) && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    scrollView: {
      flex: 1,
    },
    header: {
      backgroundColor: '#dc2626',
      paddingVertical: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
    },
    card: {
      backgroundColor: '#ffffff',
      margin: 16,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    // Stepper Styles
    stepperContainer: {
      marginBottom: 30,
    },
    progressBar: {
      height: 4,
      backgroundColor: '#e5e7eb',
      borderRadius: 2,
      marginBottom: 20,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#dc2626',
      borderRadius: 2,
    },
    stepsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stepItem: {
      alignItems: 'center',
      flex: 1,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepCircleActive: {
      backgroundColor: '#dc2626',
    },
    stepCircleInactive: {
      backgroundColor: '#e5e7eb',
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    stepNumberActive: {
      color: '#ffffff',
    },
    stepNumberInactive: {
      color: '#6b7280',
    },
    stepLabel: {
      fontSize: 12,
      color: '#6b7280',
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    
    // Form Styles
    stepContainer: {
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#ffffff',
      color: '#111827',
    },
    inputError: {
      borderColor: '#ef4444',
    },
    textArea: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#ffffff',
      color: '#111827',
      minHeight: 100,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      backgroundColor: '#ffffff',
      overflow: 'hidden',
    },
    picker: {
      height: 50,
      color: '#111827',
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      marginTop: 4,
    },
    
    // Checkbox Styles
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: '#d1d5db',
      borderRadius: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#dc2626',
      borderColor: '#dc2626',
    },
    checkboxText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    checkboxLabel: {
      fontSize: 14,
      color: '#374151',
      flex: 1,
    },
    
    // Review Styles
    reviewContainer: {
      marginBottom: 20,
    },
    reviewTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 20,
    },
    reviewContent: {
      backgroundColor: '#f9fafb',
      borderRadius: 8,
      padding: 16,
    },
    reviewRow: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    reviewLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6b7280',
      width: 120,
      marginRight: 12,
    },
    reviewValue: {
      fontSize: 14,
      color: '#111827',
      flex: 1,
    },
    
    // Button Styles
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    previousButton: {
      flex: 1,
      backgroundColor: '#6b7280',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginRight: 10,
    },
    previousButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    nextButton: {
      flex: 1,
      backgroundColor: '#dc2626',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginLeft: 10,
    },
    nextButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    submitButton: {
      flex: 1,
      backgroundColor: '#059669',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginLeft: 10,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    disabledButton: {
      backgroundColor: '#9ca3af',
      opacity: 0.6,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });