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
  Dimensions,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CheckBox from '@react-native-community/checkbox';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const firebaseConfig = {
  // Replace with your actual Firebase config
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};

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

const Stepper = ({ steps, currentStep }) => (
  <View style={styles.stepperContainer}>
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill,
          { width: `${(currentStep / (steps.length - 1)) * 100}%` }
        ]}
      />
    </View>
    <View style={styles.stepsRow}>
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

const CustomPicker = ({ label, value, onValueChange, items, error, placeholder }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.pickerContainer, error && styles.inputError]}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label={placeholder} value="" />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function BecomeDonor({ navigation, user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    email: '',
    mobile: '',
    whatsapp: '',
    country: 'India',
    state: 'Tamil Nadu',
    permanentCity: '',
    residentCity: '',
    sameAsPermenant: false,
    acceptTerms: false,
    dateOfBirth: new Date(),
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const steps = ['Personal Details', 'Contact Info', 'City Info', 'Confirmation'];
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      const checkExistingDonor = async () => {
        const donorsRef = collection(db, 'donors');
        const q = query(donorsRef, where('Email', '==', user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          navigation.navigate('Dashboard');
        }
      };
      checkExistingDonor();
    }
  }, [user, navigation]);

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
        // Email validation - but don't require it to be manually entered since it's auto-filled
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

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
      // Calculate age from date of birth
      const today = new Date();
      const age = today.getFullYear() - selectedDate.getFullYear();
      const isBeforeBirthday = today.getMonth() < selectedDate.getMonth() || 
                             (today.getMonth() === selectedDate.getMonth() && today.getDate() < selectedDate.getDate());
      const calculatedAge = isBeforeBirthday ? age - 1 : age;
      setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
    }
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

  const handleSubmit = async () => {
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
        DateOfBirth: formData.dateOfBirth.toISOString().split('T')[0],
        registeredAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'donors'), donorData);
      
      Alert.alert(
        'Success!',
        'Thank you for registering as a blood donor! Your registration has been successful.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Error adding donor: ', error);
      Alert.alert(
        'Error',
        'Failed to submit registration. Please try again later.',
        [{ text: 'OK' }]
      );
      setSubmitting(false);
    }
  };

  const renderPersonalDetails = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="Enter your name"
          placeholderTextColor="#999"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={[styles.input, errors.age && styles.inputError]}
          value={formData.age}
          onChangeText={(text) => handleChange('age', text)}
          placeholder="Enter your age"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={[styles.input, styles.dateButton, errors.dateOfBirth && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formData.dateOfBirth.toDateString()}
          </Text>
        </TouchableOpacity>
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dateOfBirth}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <CustomPicker
        label="Gender"
        value={formData.gender}
        onValueChange={(value) => handleChange('gender', value)}
        items={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' }
        ]}
        error={errors.gender}
        placeholder="Select gender"
      />

      <CustomPicker
        label="Blood Group"
        value={formData.bloodGroup}
        onValueChange={(value) => handleChange('bloodGroup', value)}
        items={[
          { label: 'A+', value: 'A+' },
          { label: 'A-', value: 'A-' },
          { label: 'B+', value: 'B+' },
          { label: 'B-', value: 'B-' },
          { label: 'AB+', value: 'AB+' },
          { label: 'AB-', value: 'AB-' },
          { label: 'O+', value: 'O+' },
          { label: 'O-', value: 'O-' }
        ]}
        error={errors.bloodGroup}
        placeholder="Select blood group"
      />
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.disabledInput}>
          <Text style={[styles.disabledText, { color: '#374151' }]}>
            {formData.email || 'No email provided'}
          </Text>
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile</Text>
        <TextInput
          style={[styles.input, errors.mobile && styles.inputError]}
          value={formData.mobile}
          onChangeText={(text) => handleChange('mobile', text)}
          placeholder="Enter your mobile number"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
        {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={[styles.input, errors.whatsapp && styles.inputError]}
          value={formData.whatsapp}
          onChangeText={(text) => handleChange('whatsapp', text)}
          placeholder="Enter your WhatsApp number"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
        {errors.whatsapp && <Text style={styles.errorText}>{errors.whatsapp}</Text>}
      </View>
    </View>
  );

  const renderCityInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Country</Text>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>India</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>State</Text>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>Tamil Nadu</Text>
        </View>
      </View>

      <CustomPicker
        label="Permanent City"
        value={formData.permanentCity}
        onValueChange={(value) => {
          handleChange('permanentCity', value);
          if (formData.sameAsPermenant) {
            handleChange('residentCity', value);
          }
        }}
        items={tamilNaduCities.map(city => ({ label: city, value: city }))}
        error={errors.permanentCity}
        placeholder="Select your permanent city"
      />

      <CustomPicker
        label="Resident City"
        value={formData.residentCity}
        onValueChange={(value) => handleChange('residentCity', value)}
        items={tamilNaduCities.map(city => ({ label: city, value: city }))}
        error={errors.residentCity}
        placeholder="Select your resident city"
      />

      <View style={styles.checkboxContainer}>
        <CheckBox
          value={formData.sameAsPermenant}
          onValueChange={(checked) => {
            setFormData(prev => ({
              ...prev,
              sameAsPermenant: checked,
              residentCity: checked ? prev.permanentCity : ''
            }));
          }}
          tintColors={{ true: '#dc2626', false: '#999' }}
        />
        <Text style={styles.checkboxLabel}>Same as permanent city</Text>
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <View style={styles.checkboxContainer}>
        <CheckBox
          value={formData.acceptTerms}
          onValueChange={(checked) => handleChange('acceptTerms', checked)}
          tintColors={{ true: '#dc2626', false: '#999' }}
        />
        <Text style={styles.checkboxLabel}>
          I accept the terms and conditions
        </Text>
      </View>
      {errors.acceptTerms && <Text style={styles.errorText}>{errors.acceptTerms}</Text>}

      {formData.acceptTerms && (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Please review your information:</Text>
          <View style={styles.reviewGrid}>
            {[
              ['Name', formData.name],
              ['Age', formData.age],
              ['Date of Birth', formData.dateOfBirth.toDateString()],
              ['Blood Group', formData.bloodGroup],
              ['Gender', formData.gender],
              ['Email', formData.email],
              ['Mobile', formData.mobile],
              ['WhatsApp', formData.whatsapp],
              ['State', 'Tamil Nadu'],
              ['Permanent City', formData.permanentCity],
              ['Resident City', formData.residentCity || formData.permanentCity]
            ].map(([label, value], index) => (
              <View key={index} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{label}:</Text>
                <Text style={styles.reviewValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalDetails();
      case 1: return renderContactInfo();
      case 2: return renderCityInfo();
      case 3: return renderConfirmation();
      default: return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Become a Blood Donor</Text>
      
      {submitStatus.message && (
        <View style={[
          styles.alert,
          submitStatus.type === 'success' && styles.successAlert,
          submitStatus.type === 'error' && styles.errorAlert,
          submitStatus.type === 'info' && styles.infoAlert
        ]}>
          <Text style={[
            styles.alertText,
            submitStatus.type === 'success' && styles.successText,
            submitStatus.type === 'error' && styles.errorText,
            submitStatus.type === 'info' && styles.infoText
          ]}>
            {submitStatus.message}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Stepper steps={steps} currentStep={currentStep} />
        
        {renderStepContent()}

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePrevious}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !isStepValid() && styles.disabledButton,
                { marginLeft: currentStep > 0 ? 'auto' : 0 }
              ]}
              onPress={handleNext}
              disabled={!isStepValid()}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isStepValid() || submitting) && styles.disabledButton,
                { marginLeft: 'auto' }
              ]}
              onPress={handleSubmit}
              disabled={!isStepValid() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#b91c1c',
  },
  alert: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successAlert: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  infoAlert: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
  },
  alertText: {
    fontSize: 14,
  },
  successText: {
    color: '#166534',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  infoText: {
    color: '#1e40af',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepperContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#fecaca',
    borderRadius: 2,
    marginBottom: 16,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#dc2626',
  },
  stepCircleInactive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberInactive: {
    color: '#dc2626',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#b91c1c',
    textAlign: 'center',
  },
  stepContent: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#b91c1c',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  input: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#6b7280',
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1e40af',
    flex: 1,
  },
  reviewContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 16,
  },
  reviewGrid: {
    gap: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reviewLabel: {
    color: '#dc2626',
    fontWeight: '500',
    flex: 1,
  },
  reviewValue: {
    color: '#7f1d1d',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#fca5a5',
    borderColor: '#fca5a5',
  },
});