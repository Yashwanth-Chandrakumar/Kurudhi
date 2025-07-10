import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { AuthContext, AuthProvider } from './AuthContext';
import SignIn from './pages/signin';
import SignUp from './pages/signup';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});

function AppContent() {
  const { user, signOut } = useContext(AuthContext);
  const [showSignup, setShowSignup] = useState(false);

  if (!user) {
    return showSignup
      ? <SignUp switchToSignIn={() => setShowSignup(false)} />
      : <SignIn switchToSignUp={() => setShowSignup(true)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, {user.email}</Text>
      <Text style={styles.text}>This is your home page with static data.</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
