import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Share,
  Modal,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { AuthContext } from '../AuthContext';
import { db } from '../firebase';
import { Feather } from '@expo/vector-icons';
import Navbar from '../components/Navbar';

const { width } = Dimensions.get('window');
const COOLDOWN_DAYS = 90;

/********************  OTP INPUT  ********************/
function OtpInput({ length = 6, onChange }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputs = useRef([]);
  
  useEffect(() => onChange(otp.join('')), [otp]);

  const handleChange = (text, idx) => {
    if (/[^0-9]/.test(text)) return;
    const arr = [...otp];
    arr[idx] = text.slice(-1);
    setOtp(arr);
    if (text && idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKey = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };

  return (
    <View style={styles.otpContainer}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={r => (inputs.current[i] = r)}
          value={digit}
          onChangeText={t => handleChange(t, i)}
          onKeyPress={e => handleKey(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          style={styles.otpInput}
          autoFocus={i === 0}
        />
      ))}
    </View>
  );
}

/********************  DONATION REQUEST CARD  ********************/
function DonorRequestCard({ request, donorRecord, user, onRefresh }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [donation, setDonation] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time donation listener
  useEffect(() => {
    if (!user || !request.id) return;

    const donationsRef = collection(db, 'requests', request.id, 'donations');
    const q = query(donationsRef, where('donorId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const donationDoc = querySnapshot.docs[0];
        setDonation({ id: donationDoc.id, ...donationDoc.data() });
      } else {
        setDonation(null);
      }
    });

    return () => unsubscribe();
  }, [user, request.id]);

  const getCooldownDetails = () => {
    if (!donorRecord?.lastDonationDate) {
      return { canDonate: true, remainingDays: 0 };
    }

    let lastDonation;
    if (typeof donorRecord.lastDonationDate === 'object' && typeof donorRecord.lastDonationDate.toDate === 'function') {
      lastDonation = donorRecord.lastDonationDate.toDate();
    } else {
      lastDonation = new Date(donorRecord.lastDonationDate);
    }

    if (isNaN(lastDonation)) {
      return { canDonate: true, remainingDays: 0 };
    }

    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - lastDonation);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const canDonate = diffDays >= COOLDOWN_DAYS;
    const remainingDays = canDonate ? 0 : COOLDOWN_DAYS - diffDays;
    return { canDonate, remainingDays };
  };

  const { canDonate, remainingDays } = getCooldownDetails();

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleDonateClick = async () => {
    if (!canDonate) {
      Alert.alert('Cannot Donate', `You can donate again in ${remainingDays} day${remainingDays === 1 ? '' : 's'}.`);
      return;
    }

    setIsLoading(true);
    try {
      const donorOtp = generateOTP();
      const requesterOtp = generateOTP();
      
      const donationData = {
        requestId: request.id,
        donorId: user.uid,
        donorEmail: user.email,
        donorName: donorRecord.Name,
        donorOtp,
        requesterOtp,
        donorOtpVerified: false,
        requesterOtpVerified: false,
        timestamp: new Date(),
      };
      
      const donationsRef = collection(db, 'requests', request.id, 'donations');
      await addDoc(donationsRef, donationData);
      
      Alert.alert(
        'Donation Initiated!',
        `Your donation has been registered. Share your OTP with the requester: ${donorOtp}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error initiating donation:', error);
      Alert.alert('Error', 'Failed to initiate donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRequesterOtp = async () => {
    if (!donation || enteredOtp !== donation.requesterOtp) {
      Alert.alert('Invalid OTP', 'Please check the OTP and try again.');
      return;
    }
    
    if (!canDonate) {
      Alert.alert('Cannot Complete', `You can donate again in ${remainingDays} day${remainingDays === 1 ? '' : 's'}.`);
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'requests', request.id, 'donations', donation.id), {
        donorOtpVerified: true
      });
      
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, {
        UnitsDonated: increment(1)
      });
      
      const donorQuery = query(collection(db, 'donors'), where('Email', '==', user.email));
      const donorSnapshot = await getDocs(donorQuery);
      if (!donorSnapshot.empty) {
        const donorRef = doc(db, 'donors', donorSnapshot.docs[0].id);
        await updateDoc(donorRef, {
          lastDonationDate: new Date().toISOString().split('T')[0]
        });
      }
      
      Alert.alert('Success!', 'Your donation has been verified. Thank you for saving lives!');
      setEnteredOtp('');
      onRefresh?.();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDonation = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for cancellation.');
      return;
    }

    setIsLoading(true);
    try {
      const cancellationData = {
        donorId: user.uid,
        donorEmail: user.email,
        donorName: donorRecord.Name,
        reason: cancelReason,
        timestamp: new Date(),
      };
      
      await addDoc(collection(db, 'requests', request.id, 'cancellations'), cancellationData);
      await deleteDoc(doc(db, 'requests', request.id, 'donations', donation.id));
      
      setShowCancelModal(false);
      setCancelReason('');
      Alert.alert('Cancelled', 'Your donation has been cancelled.');
    } catch (error) {
      console.error('Error cancelling donation:', error);
      Alert.alert('Error', 'Failed to cancel donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `🩸 URGENT: Blood Donation Needed!\n\nPatient: ${request.PatientName}\nBlood Type: ${request.BloodGroup}\nUnits Needed: ${request.UnitsNeeded}\nHospital: ${request.Hospital}\nCity: ${request.City}\n\nPlease help save a life! 🙏`;
      
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getEmergencyColor = () => {
    switch (request.EmergencyLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getEmergencyText = () => {
    switch (request.EmergencyLevel) {
      case 'high': return 'High Emergency';
      case 'medium': return 'Medium Emergency';
      default: return 'Low Emergency';
    }
  };

  const renderDonationStatus = () => {
    if (!donation) {
      if (donorRecord && (donorRecord.BloodGroup === request.BloodGroup || request.AnyBloodGroupAccepted)) {
        return (
          <TouchableOpacity
            style={[
              styles.donateBtn,
              (!canDonate || request.Verified === 'completed') && styles.disabledBtn
            ]}
            onPress={handleDonateClick}
            disabled={!canDonate || request.Verified === 'completed' || isLoading}
          >
            <Text style={styles.donateText}>
              {isLoading ? 'Processing...' : 
               request.Verified === 'completed' ? 'Request Fulfilled' :
               canDonate ? 'I want to Donate' : 
               `Donate in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`}
            </Text>
          </TouchableOpacity>
        );
      } else {
        return (
          <View style={styles.notEligibleContainer}>
            <Text style={styles.notEligibleText}>Not for your blood type</Text>
          </View>
        );
      }
    }

    if (donation.requesterOtpVerified) {
      return (
        <View style={styles.completedContainer}>
          <Feather name="check-circle" size={20} color="#10b981" />
          <Text style={styles.completedText}>Donation Completed!</Text>
        </View>
      );
    }

    if (donation.donorOtpVerified) {
      return (
        <View style={styles.waitingContainer}>
          <Feather name="clock" size={20} color="#3b82f6" />
          <Text style={styles.waitingText}>Awaiting Requester Confirmation</Text>
          <Text style={styles.otpText}>Your OTP was: {donation.donorOtp}</Text>
        </View>
      );
    }

    return (
      <View style={styles.verifyContainer}>
        <Text style={styles.verifyTitle}>Verify Donation</Text>
        <Text style={styles.verifySubtitle}>Enter the OTP from the requester:</Text>
        <OtpInput onChange={setEnteredOtp} />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.verifyBtn, isLoading && styles.disabledBtn]}
            onPress={handleVerifyRequesterOtp}
            disabled={isLoading || !canDonate}
          >
            <Text style={styles.verifyBtnText}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowCancelModal(true)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.requestCard}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.patientName}>{request.PatientName}</Text>
            <View style={[styles.emergencyBadge, { backgroundColor: getEmergencyColor() }]}>
              <Text style={styles.emergencyText}>{getEmergencyText()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Feather name="share-2" size={20} color="#6b7280" />
            </TouchableOpacity>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#6b7280"
            />
          </View>
        </View>
        
        <View style={styles.headerBottom}>
          <Text style={styles.hospitalText}>
            <Feather name="plus-square" size={14} color="#6b7280" /> {request.Hospital}
          </Text>
          <Text style={styles.locationText}>
            <Feather name="map-pin" size={14} color="#6b7280" /> {request.City}
          </Text>
        </View>
        
        <View style={styles.bloodInfo}>
          <Text style={styles.bloodGroup}>
            <Feather name="droplet" size={14} color="#ef4444" /> {request.BloodGroup}
          </Text>
          {request.RequestDate && (
            <Text style={styles.requestDate}>
              <Feather name="clock" size={14} color="#3b82f6" /> {' '}
              {new Date(request.RequestDate.seconds * 1000).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {renderDonationStatus()}

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Request Details</Text>
              <Text style={styles.detailText}>Patient: {request.PatientName}</Text>
              <Text style={styles.detailText}>Blood Group: {request.BloodGroup}</Text>
              <Text style={styles.detailText}>Units Needed: {request.UnitsNeeded}</Text>
              <Text style={styles.detailText}>
                Units Pending: {request.UnitsNeeded - (request.UnitsDonated || 0)}
              </Text>
            </View>
            
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Location & Contact</Text>
              <Text style={styles.detailText}>Hospital: {request.Hospital}</Text>
              <Text style={styles.detailText}>City: {request.City}</Text>
              <Text style={styles.detailText}>Attender: {request.AttenderName || 'N/A'}</Text>
              <Text style={styles.detailText}>Contact: {request.AttenderMobile || 'N/A'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Donation</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for cancelling your donation:
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Enter your reason here..."
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !cancelReason.trim() && styles.disabledBtn]}
                onPress={handleCancelDonation}
                disabled={!cancelReason.trim() || isLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoading ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/********************  MAIN DASHBOARD  ********************/
export default function Dashboard({ navigation }) {
  const handleNavigate = (screen) => {
    if (screen === 'home') {
      // Already on the dashboard, so do nothing or refresh
    } else if (screen === 'becomeDonor') {
      navigation.navigate('NewDonor');
    } else {
      navigation.navigate(screen);
    }
  };
  const { user } = useContext(AuthContext);
  const [donorRecord, setDonorRecord] = useState(null);
  const [requests, setRequests] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    unitsNeeded: 0
  });

  const fetchDonorRecord = async () => {
    if (!user?.email) return;
    
    try {
      const q = query(collection(db, 'donors'), where('Email', '==', user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setDonorRecord(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error fetching donor record:', error);
    }
  };

  const fetchUserDonations = async () => {
    if (!user?.uid) return;

    try {
      const requestsQuery = query(collection(db, 'requests'));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      let userDonationsList = [];
      
      for (const requestDoc of requestsSnapshot.docs) {
        const requestId = requestDoc.id;
        const donationsRef = collection(db, 'requests', requestId, 'donations');
        const userDonationsQuery = query(donationsRef, where('donorId', '==', user.uid));
        const userDonationsSnapshot = await getDocs(userDonationsQuery);
        
        userDonationsSnapshot.forEach(donationDoc => {
          userDonationsList.push({
            requestId: requestId,
            ...donationDoc.data()
          });
        });
      }
      
      setUserDonations(userDonationsList);
    } catch (error) {
      console.error('Error fetching user donations:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'requests'));
      const querySnapshot = await getDocs(q);
      
      const requestsData = [];
      let activeRequestsCount = 0;
      let myBloodTypeRequestsCount = 0;
      let totalActiveUnits = 0;

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        requestsData.push(data);
        
        if (data.Verified === 'accepted') {
          activeRequestsCount++;
          
          if (donorRecord && (data.BloodGroup === donorRecord.BloodGroup || data.AnyBloodGroupAccepted === true)) {
            myBloodTypeRequestsCount++;
            totalActiveUnits += parseInt(data.UnitsNeeded) || 0;
          }
        }
      });

      const completedUserRequests = userDonations.filter(d => d.requesterOtpVerified === true).length;
      
      setRequests(requestsData);
      setStats({
        totalRequests: activeRequestsCount,
        pendingRequests: myBloodTypeRequestsCount,
        completedRequests: completedUserRequests,
        unitsNeeded: totalActiveUnits
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDonorRecord(), fetchUserDonations(), fetchRequests()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDonorRecord();
  }, [user]);

  useEffect(() => {
    fetchUserDonations();
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchRequests();
      setIsLoading(false);
    };
    loadData();
  }, [donorRecord, userDonations]);

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'active') {
      return request.Verified === 'accepted';
    } else if (activeTab === 'completed') {
      const completedDonationRequestIds = userDonations
        .filter(donation => donation.requesterOtpVerified === true)
        .map(donation => donation.requestId);
      return completedDonationRequestIds.includes(request.id);
    } else if (activeTab === 'mytype' && donorRecord) {
      return (request.BloodGroup === donorRecord.BloodGroup || request.AnyBloodGroupAccepted === true) && request.Verified === 'accepted';
    }
    return true;
  });

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b91c1c" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (!donorRecord) {
    return (
      <View style={styles.container}>
        <Navbar onNavigate={handleNavigate} />
        <View style={styles.notRegisteredContainer}>
          <Feather name="user-x" size={48} color="#ef4444" />
          <Text style={styles.notRegisteredText}>
            You are not registered as a donor. Please register to view the dashboard.
          </Text>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('NewDonor')}
          >
            <Text style={styles.registerBtnText}>Become a Donor</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Navbar onNavigate={handleNavigate} />
      <ScrollView style={styles.container}>
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        <View style={styles.scrollContent}>
          <Text style={styles.title}>Blood Donation Dashboard</Text>
        
          {donorRecord && (
            <Text style={styles.welcomeText}>
              Welcome back, {donorRecord.Name}. You are a registered donor with blood type {donorRecord.BloodGroup}.
            </Text>
          )}

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Active Requests"
              value={stats.totalRequests}
              icon="alert-circle"
              color="#3b82f6"
            />
            <StatCard
              title="Eligible For Me"
              value={stats.pendingRequests}
              icon="clock"
              color="#f59e0b"
            />
            <StatCard
              title="My Completed"
              value={stats.completedRequests}
              icon="check"
              color="#10b981"
            />
            <StatCard
              title="Units Needed"
              value={stats.unitsNeeded}
              icon="droplet"
              color="#ef4444"
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {[
              { key: 'active', label: 'Active' },
              { key: 'mytype', label: 'My Blood Type' },
              { key: 'completed', label: 'Completed' }
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Requests List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#b91c1c" />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : filteredRequests.length > 0 ? (
            <View style={styles.requestsList}>
              {filteredRequests.map(request => (
                <DonorRequestCard
                  key={request.id}
                  request={request}
                  donorRecord={donorRecord}
                  user={user}
                  onRefresh={onRefresh}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noRequestsContainer}>
              <Feather name="info" size={48} color="#9ca3af" />
              <Text style={styles.noRequestsTitle}>No requests found</Text>
              <Text style={styles.noRequestsSubtitle}>
                {activeTab === 'active'
                  ? 'There are currently no active blood donation requests.'
                  : activeTab === 'mytype'
                  ? `There are no active requests matching your blood type (${donorRecord?.BloodGroup || 'Unknown'}).`
                  : 'There are no completed donation requests.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  scrollContent: {
    padding: 16,
  },
  
  // Title and Welcome Text
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  statContent: {
    flex: 1,
  },
  
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  activeTab: {
    backgroundColor: '#ef4444',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  
  activeTabText: {
    color: '#ffffff',
  },
  
  // Request Cards
  requestsList: {
    gap: 16,
  },
  
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  
  cardHeader: {
    padding: 16,
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  emergencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  
  emergencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  shareBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  
  headerBottom: {
    marginBottom: 12,
  },
  
  hospitalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  bloodInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  bloodGroup: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  
  requestDate: {
    fontSize: 14,
    color: '#3b82f6',
  },
  
  // Donation Status Components
  donateBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  donateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  disabledBtn: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  
  notEligibleContainer: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  notEligibleText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  
  completedContainer: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  
  completedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  
  waitingContainer: {
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  
  waitingText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  
  otpText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Verify Container
  verifyContainer: {
    backgroundColor: '#f8fafc',
    padding: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  verifyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  verifySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  
  verifyBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  cancelBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  
  otpInput: {
    width: 40,
    height: 48,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  
  // Expanded Content
  expandedContent: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  detailsGrid: {
    gap: 16,
  },
  
  detailCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  modalCancelBtn: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  
  modalCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  
  modalConfirmBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  
  // No Requests State
  noRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  noRequestsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  
  noRequestsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  
  // Not Registered State
  notRegisteredContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  notRegisteredText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  registerBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  registerBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});