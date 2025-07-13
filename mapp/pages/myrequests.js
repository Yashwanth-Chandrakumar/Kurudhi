import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { AuthContext } from '../AuthContext';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// OTP Input Component
function OtpInput({ length = 6, onChange }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  useEffect(() => {
    onChange(otp.join(''));
  }, [otp, onChange]);

  const handleChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text.slice(-1);
      setOtp(newOtp);
      if (text && index < length - 1) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          style={styles.otpInput}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          ref={(el) => inputsRef.current[index] = el}
          keyboardType="numeric"
          maxLength={1}
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
}

// Stats Card Component
function StatsCard({ icon, title, value, color }) {
  return (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsIconContainer}>
        <Text style={styles.statsIcon}>{icon}</Text>
      </View>
      <View style={styles.statsTextContainer}>
        <Text style={styles.statsTitle}>{title}</Text>
        <Text style={styles.statsValue}>{value}</Text>
      </View>
    </View>
  );
}

// Donation Item Component
function DonationItem({ donation, request }) {
  const [donorDetails, setDonorDetails] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showMoreModal, setShowMoreModal] = useState(false);

  useEffect(() => {
    const fetchDonorDetails = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', donation.donorId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.email) {
            const q = query(collection(db, 'donors'), where('Email', '==', userData.email));
            const donorSnapshot = await getDocs(q);
            if (!donorSnapshot.empty) {
              setDonorDetails(donorSnapshot.docs[0].data());
            } else {
              setDonorDetails({ Name: 'Anonymous Donor', Email: userData.email });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching donor details:', error);
      }
    };
    fetchDonorDetails();
  }, [donation.donorId]);

  const handleVerifyDonorOtp = async () => {
    if (enteredOtp === donation.donorOtp) {
      try {
        const donationRef = doc(db, 'requests', request.id, 'donations', donation.id);
        await updateDoc(donationRef, { requesterOtpVerified: true });
        Alert.alert('Success', 'OTP verified successfully. Donation is now complete!');
      } catch (error) {
        console.error('Error verifying donor OTP:', error);
        Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Incorrect OTP entered.');
    }
  };

  const getStatusPill = () => {
    if (donation.requesterOtpVerified) {
      return (
        <View style={[styles.statusPill, styles.completedStatus]}>
          <Text style={styles.statusText}>✓ Completed</Text>
        </View>
      );
    }
    if (donation.donorOtpVerified) {
      return (
        <View style={[styles.statusPill, styles.confirmedStatus]}>
          <Text style={styles.statusText}>⏰ Donor Confirmed</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusPill, styles.pendingStatus]}>
        <Text style={styles.statusText}>⚠ Pending</Text>
      </View>
    );
  };

  return (
    <View style={styles.donationItem}>
      <View style={styles.donationHeader}>
        <View style={styles.donationInfo}>
          <Text style={styles.donorName}>
            {donorDetails?.Name || 'Loading...'}
          </Text>
          <Text style={styles.otpText}>
            Your OTP for this donor: <Text style={styles.otpValue}>{donation.requesterOtp}</Text>
          </Text>
        </View>
        <View style={styles.donationActions}>
          {getStatusPill()}
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => setShowMoreModal(true)}
          >
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!donation.requesterOtpVerified && donation.donorOtpVerified && (
        <View style={styles.otpVerificationContainer}>
          <Text style={styles.otpVerificationText}>
            Enter OTP from Donor to confirm donation
          </Text>
          <View style={styles.otpVerificationActions}>
            <OtpInput onChange={setEnteredOtp} />
            <TouchableOpacity 
              style={styles.verifyButton}
              onPress={handleVerifyDonorOtp}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showMoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Donor Details</Text>
            {donorDetails ? (
              <View style={styles.donorDetailsContainer}>
                <Text style={styles.donorDetailText}>
                  <Text style={styles.donorDetailLabel}>Name:</Text> {donorDetails.Name}
                </Text>
                <Text style={styles.donorDetailText}>
                  <Text style={styles.donorDetailLabel}>Email:</Text> {donorDetails.Email}
                </Text>
                <Text style={styles.donorDetailText}>
                  <Text style={styles.donorDetailLabel}>Phone:</Text> {donorDetails.MobileNumber || 'Not provided'}
                </Text>
                <Text style={styles.donorDetailText}>
                  <Text style={styles.donorDetailLabel}>Blood Group:</Text> {donorDetails.BloodGroup}
                </Text>
              </View>
            ) : (
              <Text style={styles.loadingText}>Loading details...</Text>
            )}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMoreModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Requester Request Card Component
function RequesterRequestCard({ request }) {
  const [donations, setDonations] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'requests', request.id, 'donations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [request.id]);

  const getStatusChip = (status) => {
    const statusConfig = {
      'completed': { color: '#22c55e', text: 'Completed' },
      'accepted': { color: '#3b82f6', text: 'Active' },
      'received': { color: '#eab308', text: 'Pending' },
      'rejected': { color: '#ef4444', text: 'Rejected' },
    };

    const config = statusConfig[status] || { color: '#6b7280', text: status };
    
    return (
      <View style={[styles.statusChip, { backgroundColor: config.color }]}>
        <Text style={styles.statusChipText}>{config.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.requestCard}>
      <TouchableOpacity 
        style={styles.requestHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.requestInfo}>
          <Text style={styles.patientName}>{request.PatientName}</Text>
          <Text style={styles.requestReason}>For: {request.Reason}</Text>
        </View>
        <View style={styles.requestActions}>
          {getStatusChip(request.Verified)}
          <Text style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.requestDetails}>
        <View style={styles.requestDetail}>
          <Text style={styles.requestDetailIcon}>🩸</Text>
          <Text style={styles.requestDetailText}>{request.BloodGroup}</Text>
        </View>
        <View style={styles.requestDetail}>
          <Text style={styles.requestDetailIcon}>🤝</Text>
          <Text style={styles.requestDetailText}>
            {request.UnitsDonated || 0} / {request.UnitsNeeded} Units
          </Text>
        </View>
        <View style={styles.requestDetail}>
          <Text style={styles.requestDetailIcon}>👥</Text>
          <Text style={styles.requestDetailText}>{donations.length} Donor(s)</Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedSection}>
          <Text style={styles.donorsListTitle}>Donors List</Text>
          {donations.length > 0 ? (
            <View style={styles.donationsList}>
              {donations.map(donation => (
                <DonationItem key={donation.id} donation={donation} request={request} />
              ))}
            </View>
          ) : (
            <Text style={styles.noDonorsText}>No donors have responded yet.</Text>
          )}
        </View>
      )}
    </View>
  );
}

// Main Component

export default function MyRequestsPage() {
  const { user } = useContext(AuthContext);
  const [myRequests, setMyRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('accepted');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    unitsReceived: 0
  });

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'requests'), where('uuid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyRequests(requestsData);

      // Calculate stats
      const total = requestsData.length;
      const pending = requestsData.filter(r => r.Verified === 'accepted' || r.Verified === 'received').length;
      const completed = requestsData.filter(r => r.Verified === 'completed').length;
      const unitsReceived = requestsData.reduce((acc, req) => acc + (parseInt(req.UnitsDonated) || 0), 0);

      setStats({ total, pending, completed, unitsReceived });
    });
    
    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh will be handled by the real-time listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  const tabStatuses = ['accepted', 'completed', 'received', 'rejected'];
  const filteredRequests = myRequests.filter(req => activeTab === 'all' || req.Verified === activeTab);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Requests</Text>
          <Text style={styles.headerSubtitle}>
            Track and manage all your blood donation requests.
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard 
              icon="📄" 
              title="Total Requests" 
              value={stats.total} 
              color="#3b82f6" 
            />
            <StatsCard 
              icon="📊" 
              title="Pending/Active" 
              value={stats.pending} 
              color="#eab308" 
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard 
              icon="✅" 
              title="Completed" 
              value={stats.completed} 
              color="#22c55e" 
            />
            <StatsCard 
              icon="🩸" 
              title="Units Received" 
              value={stats.unitsReceived} 
              color="#ef4444" 
            />
          </View>
        </View>

        <View style={styles.tabContainer}>
          {tabStatuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.tab,
                activeTab === status && styles.activeTab
              ]}
              onPress={() => setActiveTab(status)}
            >
              <Text style={[
                styles.tabText,
                activeTab === status && styles.activeTabText
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.requestsList}>
          {filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <RequesterRequestCard key={request.id} request={request} />
            ))
          ) : (
            <View style={styles.noRequestsContainer}>
              <Text style={styles.noRequestsText}>
                No requests found in the '{activeTab}' category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsIcon: {
    fontSize: 20,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#dc2626',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
  },
  requestsList: {
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  requestReason: {
    fontSize: 14,
    color: '#6b7280',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  expandIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  requestDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDetailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  requestDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  expandedSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  donorsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  donationsList: {
    gap: 12,
  },
  noDonorsText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 16,
  },
  donationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donationInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  otpText: {
    fontSize: 14,
    color: '#6b7280',
  },
  otpValue: {
    fontWeight: 'bold',
    color: '#dc2626',
  },
  donationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedStatus: {
    backgroundColor: '#22c55e',
  },
  confirmedStatus: {
    backgroundColor: '#3b82f6',
  },
  pendingStatus: {
    backgroundColor: '#eab308',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  otpVerificationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  otpVerificationText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  otpVerificationActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  verifyButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width - 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  donorDetailsContainer: {
    marginBottom: 20,
  },
  donorDetailText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  donorDetailLabel: {
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noRequestsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noRequestsText: {
    fontSize: 16,
    color: '#6b7280',
  },
});