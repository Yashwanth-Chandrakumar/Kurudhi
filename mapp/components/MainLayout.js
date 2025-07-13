import React from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from './Navbar';

const MainLayout = ({ children, navigation, route }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <Navbar navigation={navigation} currentRoute={route.name} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
