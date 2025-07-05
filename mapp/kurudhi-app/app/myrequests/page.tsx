import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/constants/FirebaseConfig';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const db = getFirestore(app);

interface Request {
  id: string;
  patientName: string;
  bloodType: string;
  status: string;
}

export default function MyRequests() {
  const { session } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchRequests = async () => {
      try {
        const q = query(collection(db, 'requests'), where('requesterId', '==', session.uid));
        const querySnapshot = await getDocs(q);
        const userRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
        setRequests(userRequests);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [session]);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>{item.patientName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text>Blood Type: {item.bloodType}</Text>
              <Text>Status: {item.status}</Text>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={<Text>You have no active requests.</Text>}
      />
    </View>
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
});
