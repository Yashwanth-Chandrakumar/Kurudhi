import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TabBar = () => {
  const router = useRouter();
  const segments = useSegments();
  const activeRoute = segments[0] || 'dashboard';

  const tabs = [
    { name: 'dashboard', label: 'Dashboard', icon: 'home' },
    { name: 'myrequests', label: 'My Requests', icon: 'list' },
    { name: 'needdonor', label: 'Need Donor', icon: 'search' },
    { name: 'newdonor', label: 'New Donor', icon: 'add-circle' },
    { name: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tabItem}
          onPress={() => router.push(`/${tab.name}`)}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={activeRoute === tab.name ? '#C53030' : '#A0AEC0'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeRoute === tab.name ? '#C53030' : '#A0AEC0' },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});

export default TabBar;
