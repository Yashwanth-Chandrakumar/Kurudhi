import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext, AuthProvider } from './AuthContext';
import SignIn from './pages/signin';
import SignUp from './pages/signup';
import Dashboard from './pages/dashboard';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RequestDonor } from './pages/needdonor';
import MainLayout from './components/MainLayout';
import MyRequestsPage from './pages/myrequests';
import ProfilePage from './pages/profile';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="home" options={{ headerShown: false }}>
              {props => (
                <MainLayout {...props}>
                  <Dashboard {...props} />
                </MainLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="needdonor" options={{ headerShown: false }}>
              {props => (
                <MainLayout {...props}>
                  <RequestDonor {...props} />
                </MainLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="myrequests" options={{ headerShown: false }}>
              {props => (
                <MainLayout {...props}>
                  <MyRequestsPage {...props} />
                </MainLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="profile" options={{ headerShown: false }}>
              {props => (
                <MainLayout {...props}>
                  <ProfilePage {...props} />
                </MainLayout>
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}