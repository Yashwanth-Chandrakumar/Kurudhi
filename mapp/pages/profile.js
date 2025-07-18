import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../AuthContext'; // Adjust path as needed
import { useNavigation } from '@react-navigation/native';

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

const states = ["Tamil Nadu"];
const countries = ["India"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["male", "female", "other"];

const ProfilePage = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const db = getFirestore();
  const storage = getStorage();
  
  const [donorData, setDonorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [donorDocId, setDonorDocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchDonorData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "donors"), where("Email", "==", user.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setDonorData(data);
          setDonorDocId(snapshot.docs[0].id);
          setSameAsPermanent(data.PermanentCity === data.ResidentCity);
        }
      } catch (error) {
        console.error('Error fetching donor data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonorData();
  }, [user, db]);

  const handleProfilePictureChange = () => {
    if (!isEditing) return;
    
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        const base64String = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
        setProfilePicture(base64String);
        setDonorData(prev => ({
          ...prev,
          profile_picture: base64String
        }));
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const donorRef = doc(db, 'donors', donorDocId);
      await updateDoc(donorRef, donorData);
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setDonorData(prev => ({ ...prev, [name]: value }));
  };

  const renderPicker = (name, value, options, placeholder) => (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={value || ''}
        onValueChange={(itemValue) => handleChange(name, itemValue)}
        enabled={isEditing}
        style={[styles.picker, !isEditing && styles.disabledPicker]}
      >
        <Picker.Item label={placeholder} value="" />
        {options.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>
    </View>
  );

  const renderCheckbox = () => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => {
        if (!isEditing) return;
        const newValue = !sameAsPermanent;
        setSameAsPermanent(newValue);
        if (newValue) {
          setDonorData(prev => ({ ...prev, ResidentCity: prev.PermanentCity }));
        }
      }}
      disabled={!isEditing}
    >
      <View style={[styles.checkbox, sameAsPermanent && styles.checkedBox]}>
        {sameAsPermanent && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>
        Current residence same as permanent address
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!donorData) {
    return (
      <View style={styles.noProfileContainer}>
        <View style={styles.noProfileCard}>
          <Text style={styles.noProfileTitle}>No Profile Found</Text>
          <Text style={styles.noProfileText}>
            Please register as a donor to create your profile.
          </Text>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('NewDonor')}
          >
            <Text style={styles.registerButtonText}>Register as Donor</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Donor Profile</Text>
        {!isEditing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
            disabled={loading}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profilePictureContainer}>
        <TouchableOpacity onPress={handleProfilePictureChange}>
          {donorData?.profile_picture ? (
            <Image
              source={{ uri: donorData.profile_picture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderText}>👤</Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.editPhotoButton}>
              <Text style={styles.editPhotoButtonText}>✏️</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={donorData.Name || ''}
            onChangeText={(text) => handleChange('Name', text)}
            editable={isEditing}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={donorData.Age ? donorData.Age.toString() : ''}
            onChangeText={(text) => handleChange('Age', parseInt(text) || '')}
            editable={isEditing}
            keyboardType="numeric"
            placeholder="Enter your age"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={donorData.DateOfBirth || ''}
            onChangeText={(text) => handleChange('DateOfBirth', text)}
            editable={isEditing}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={donorData.Email || ''}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={donorData.MobileNumber || ''}
            onChangeText={(text) => handleChange('MobileNumber', text)}
            editable={isEditing}
            keyboardType="phone-pad"
            placeholder="Enter mobile number"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>WhatsApp Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={donorData.WhatsappNumber || ''}
            onChangeText={(text) => handleChange('WhatsappNumber', text)}
            editable={isEditing}
            keyboardType="phone-pad"
            placeholder="Enter WhatsApp number"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Group</Text>
          {renderPicker('BloodGroup', donorData.BloodGroup, bloodGroups, 'Select Blood Group')}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          {renderPicker('Gender', donorData.Gender, genders, 'Select Gender')}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          {renderPicker('Country', donorData.Country, countries, 'Select Country')}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          {renderPicker('State', donorData.State, states, 'Select State')}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Permanent City</Text>
          {renderPicker('PermanentCity', donorData.PermanentCity, tamilNaduCities, 'Select Permanent City')}
        </View>

        {renderCheckbox()}

        {!sameAsPermanent && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current City</Text>
            {renderPicker('ResidentCity', donorData.ResidentCity, tamilNaduCities, 'Select Current City')}
          </View>
        )}

        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  noProfileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noProfileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  noProfileText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  registerButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  profilePictureContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
  },
  profilePicture: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'white',
  },
  profilePlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 48,
    color: '#9ca3af',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoButtonText: {
    color: 'white',
    fontSize: 16,
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    // height: 44, // Removed to fix text cropping on Android
  },
  disabledPicker: {
    backgroundColor: '#f3f4f6',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfilePage;