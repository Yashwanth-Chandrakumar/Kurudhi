import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/constants/FirebaseConfig';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'expo-router';

const db = getFirestore(app);
const auth = getAuth(app);

interface Donor {
  name: string;
  bloodType: string;
}

interface Request {
  id: string;
  patientName: string;
  bloodType: string;
  status: string;
}

export default function Dashboard() {
  const { session } = useSession();
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        // Fetch donor status
        const donorRef = doc(db, 'donors', session.uid);
        const donorSnap = await getDoc(donorRef);
        if (donorSnap.exists()) {
          setDonor(donorSnap.data() as Donor);
        }

        // Fetch recent requests
        const q = query(collection(db, 'requests'), where('requesterId', '==', session.uid));
        const querySnapshot = await getDocs(q);
        const userRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
        setRequests(userRequests);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        router.replace('/(auth)/signin');
      })
      .catch((error) => {
        Alert.alert('Error', 'Could not sign out.');
      });
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Welcome, {donor?.name || 'User'}</CardTitle>
        </CardHeader>
        <CardContent>
          {donor ? (
            <Text>Your blood type is {donor.bloodType}.</Text>
          ) : (
            <Text>You are not yet registered as a donor.</Text>
          )}
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Your Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            requests.map(req => (
              <View key={req.id} style={styles.requestItem}>
                <Text>{req.patientName} - {req.bloodType} ({req.status})</Text>
              </View>
            ))
          ) : (
            <Text>You have no recent requests.</Text>
          )}
        </CardContent>
      </Card>

      <Button title="Sign Out" onPress={handleSignOut} style={styles.signOutButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  requestItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  signOutButton: {
    marginTop: 16,
  },
});
