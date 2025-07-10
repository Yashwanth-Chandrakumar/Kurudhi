import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Entypo, Feather } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../AuthContext';
import { db } from '../firebase';

/*
  Complete React Native Navbar Component
  Updated layout: Menu icon (left) - Logo (center) - Profile icon (right)
  • Role-based navigation (user/admin/superadmin)
  • Donor status checking
  • Profile picture display
  • Encrypted UID handling
  • Logout confirmation
  • Separate menu and profile dropdowns
*/

export default function Navbar({ 
  onNavigate = () => {},
  currentRoute = 'home' // helps with active state highlighting
}) {
  const { user, signOut } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isDonor, setIsDonor] = useState(true); // Default to true to hide "Become a Donor"
  const [profilePicture, setProfilePicture] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  // Check user role using encrypted UID (matching web version)
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const encryptedUID = await AsyncStorage.getItem('userUUID');
        if (encryptedUID) {
          const secretKey = process.env.EXPO_PUBLIC_UUID_SECRET || 'default_secret_key';
          const bytes = CryptoJS.AES.decrypt(encryptedUID, secretKey);
          const decryptedUID = bytes.toString(CryptoJS.enc.Utf8);
          
          if (decryptedUID) {
            const userDocRef = doc(db, 'users', decryptedUID);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              setUserRole(data.role);
            } else {
              setUserRole(null);
            }
          }
        }
      } catch (error) {
        console.error('Error decrypting UID or fetching user data:', error);
        setUserRole(null);
      }
    };

    if (user) {
      checkUserRole();
    }
  }, [user]);

  // Check donor status
  useEffect(() => {
    const checkIfDonor = async () => {
      if (!user?.email) {
        setIsDonor(true); // Default to true to hide "Become a Donor"
        return;
      }

      try {
        const q = query(collection(db, 'donors'), where('Email', '==', user.email));
        const snapshot = await getDocs(q);
        setIsDonor(!snapshot.empty); // Hide if user exists in donors collection
      } catch (error) {
        console.error('Error checking donor status:', error);
        setIsDonor(true); // Default to true on error
      }
    };

    checkIfDonor();
  }, [user]);

  // Fetch profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.email) return;
      
      try {
        const q = query(collection(db, 'donors'), where('Email', '==', user.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setProfilePicture(data.profile_picture);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePicture();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      setShowLogoutConfirm(false);
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      onNavigate('signin');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const closeMenuAndNavigate = (destination) => {
    setIsMenuOpen(false);
    onNavigate(destination);
  };

  const closeProfileAndNavigate = (destination) => {
    setIsProfileOpen(false);
    onNavigate(destination);
  };

  const showLogoutAlert = () => {
    setShowLogoutConfirm(true);
  };

  const navigationItems = [
    { key: 'home', label: 'Home', show: true },
    { key: 'dashboard', label: 'Dashboard', show: true },
    { key: 'about', label: 'About', show: true },
    { key: 'newdonor', label: 'Become a Donor', show: user && !isDonor },
    { key: 'needdonor', label: 'Require a Donor', show: true },
    { key: 'camp', label: 'Host a Camp', show: true },
    { key: 'myrequests', label: 'My Requests', show: !!user },
  ];

  const profileItems = [
    { key: 'profile', label: 'Profile', show: true },
    { key: 'admin', label: 'Admin', show: userRole === 'admin' || userRole === 'superadmin' },
    { key: 'superadmin', label: 'Superadmin', show: userRole === 'superadmin' },
  ];

  // Unauthenticated header
  if (!user) {
    return (
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#b91c1c" />
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            {/* Empty space for alignment */}
          </View>
          <View style={styles.centerSection}>
            <TouchableOpacity onPress={() => onNavigate('home')}>
              <Image source={require('../assets/kk.png')} style={styles.logo} />
            </TouchableOpacity>
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity 
              onPress={() => onNavigate('signin')}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#b91c1c" />
      <View style={styles.headerContent}>
        {/* Left Section - Menu Icon */}
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)} style={styles.iconButton}>
            <Entypo name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Center Section - Logo */}
        <View style={styles.centerSection}>
          <TouchableOpacity onPress={() => onNavigate('home')}>
            <Image source={require('../assets/kk.png')} style={styles.logo} />
          </TouchableOpacity>
        </View>

        {/* Right Section - Profile Icon */}
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={() => setIsProfileOpen(!isProfileOpen)} style={styles.iconButton}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profileImageSmall} />
            ) : (
              <View style={styles.profileImagePlaceholderSmall}>
                <Feather name="user" size={20} color="#b91c1c" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Menu Modal */}
      <Modal
        visible={isMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            <ScrollView style={styles.menuScroll}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Navigation</Text>
              </View>
              
              {/* Navigation Items */}
              {navigationItems.map((item) => {
                if (!item.show) return null;
                return (
                  <MenuItem
                    key={item.key}
                    label={item.label}
                    onPress={() => closeMenuAndNavigate(item.key)}
                    isActive={currentRoute === item.key}
                  />
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Menu Modal */}
      <Modal
        visible={isProfileOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsProfileOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsProfileOpen(false)}
        >
          <View style={[styles.profileMenuContainer, { top: insets.top + 60 }]}>
            <ScrollView style={styles.menuScroll}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileHeaderContent}>
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Feather name="user" size={24} color="#b91c1c" />
                    </View>
                  )}
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
              </View>

              {/* Profile Menu Items */}
              {profileItems.map((item) => {
                if (!item.show) return null;
                return (
                  <MenuItem
                    key={item.key}
                    label={item.label}
                    onPress={() => closeProfileAndNavigate(item.key)}
                    isActive={currentRoute === item.key}
                  />
                );
              })}

              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutButton} onPress={showLogoutAlert}>
                <Feather name="log-out" size={20} color="#fff" style={styles.logoutIcon} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Confirm Logout</Text>
            <Text style={styles.confirmModalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.logoutConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuItem({ label, onPress, isActive = false }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.menuItem, isActive && styles.activeMenuItem]}
    >
      <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#b91c1c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    height: 40,
    width: 120,
    resizeMode: 'contain',
  },
  iconButton: {
    padding: 8,
  },
  profileImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImagePlaceholderSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loginButtonText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    maxHeight: '70%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  profileMenuContainer: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    maxHeight: '70%',
    width: 280,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  menuScroll: {
    maxHeight: '100%',
  },
  menuHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b91c1c',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeMenuItem: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#b91c1c',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  activeMenuItemText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  profileHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#b91c1c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutConfirmButton: {
    backgroundColor: '#b91c1c',
  },
  logoutConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});