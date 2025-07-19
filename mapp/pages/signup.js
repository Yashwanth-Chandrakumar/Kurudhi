import React, { useState, useContext } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../AuthContext';

export default function SignUp({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
    const [isFormVisible, setIsFormVisible] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { signUp } = useContext(AuthContext);

    const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    let tempDate = new Date(currentDate);
    let fDate = tempDate.getFullYear() + '-' + (tempDate.getMonth() + 1) + '-' + tempDate.getDate();
    handleChange('dob', fDate);
  }

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    // You can add field-specific validation here if needed
  };

  const handleSignUp = async () => {
    setSubmitStatus({ type: '', message: '' });
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.dob || !formData.email || !formData.password) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all fields.'
      });
      return;
    }

    try {
      await signUp(
        formData.firstName,
        formData.lastName,
        formData.dob,
        formData.email,
        formData.password
      );
      
      // Hide form and show success message
      setIsFormVisible(false);
      setSubmitStatus({
        type: 'success',
        message: 'Verification email sent! Please check your inbox. Redirecting to login in 5 seconds...'
      });
      
      // Redirect to sign in after 5 seconds
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 5000);
      
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message
      });
    }
  };

  const renderError = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <Text style={styles.fieldError}>{errors[fieldName]}</Text>
      );
    }
    return null;
  };

  // If form is hidden, show only the success message
  if (!isFormVisible) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>Check Your Email</Text>
          <View style={styles.successContainer}>
            <Text style={styles.successMessage}>
              {submitStatus.message}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Blood Donation Platform</Text>
        <Text style={styles.subheading}>Create your account</Text>
        
        {/* Display submit status message if available */}
        {submitStatus.message && (
          <View style={[
            styles.statusContainer,
            submitStatus.type === 'success' ? styles.successContainer : styles.errorContainer
          ]}>
            <Text style={[
              styles.statusMessage,
              submitStatus.type === 'success' ? styles.successText : styles.errorText
            ]}>
              {submitStatus.message}
            </Text>
          </View>
        )}
        
        <TextInput 
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(value) => handleChange('firstName', value)}
          onBlur={() => handleBlur('firstName')}
          style={[
            styles.input,
            touched.firstName && errors.firstName ? styles.inputError : {}
          ]}
        />
        {renderError('firstName')}
        
        <TextInput 
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(value) => handleChange('lastName', value)}
          onBlur={() => handleBlur('lastName')}
          style={[
            styles.input,
            touched.lastName && errors.lastName ? styles.inputError : {}
          ]}
        />
        {renderError('lastName')}
        
                <Pressable onPress={() => setShowDatePicker(true)}>
          <TextInput 
            placeholder="Date of Birth"
            value={formData.dob}
            editable={false}
            style={styles.input}
          />
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={'date'}
            is24Hour={true}
            display="default"
            onChange={onChangeDate}
          />
        )}

        {renderError('dob')}
        
        <TextInput 
          placeholder="name@example.com" 
          value={formData.email} 
          onChangeText={(value) => handleChange('email', value)}
          onBlur={() => handleBlur('email')}
          style={[
            styles.input,
            touched.email && errors.email ? styles.inputError : {}
          ]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {renderError('email')}
        
        <TextInput 
          placeholder="Create a secure password" 
          secureTextEntry 
          value={formData.password} 
          onChangeText={(value) => handleChange('password', value)}
          onBlur={() => handleBlur('password')}
          style={[
            styles.input,
            touched.password && errors.password ? styles.inputError : {}
          ]} 
        />
        {renderError('password')}

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.switchText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2', // Light red background similar to Next.js version
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fecaca', // Light red border
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#b91c1c', // Red color to match Next.js theme
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusMessage: {
    textAlign: 'center',
    fontSize: 14,
  },
  successText: {
    color: '#166534',
  },
  errorText: {
    color: '#dc2626',
  },
  successMessage: {
    color: '#166534',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#fecaca', // Light red border
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc2626', // Red border for errors
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  button: {
    width: '100%',
    height: 44,
    backgroundColor: '#dc2626', // Red background to match theme
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#dc2626', // Red color for consistency
    fontSize: 14,
    fontWeight: '500',
  }
});