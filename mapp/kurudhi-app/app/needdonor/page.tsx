import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '@/constants/FirebaseConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/hooks/useSession';

const db = getFirestore(app);

export default function NeedDonor() {
  const { session } = useSession();
  const [patientName, setPatientName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!session) {
      Alert.alert('Error', 'You must be logged in to request a donation.');
      return;
    }

    if (!patientName || !bloodType || !contact) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        requesterId: session.uid,
        patientName,
        bloodType,
        contact,
        status: 'pending',
      });
      Alert.alert('Success', 'Your request has been submitted.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Request a Blood Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Patient's Name</Label>
          <Input
            placeholder="Full Name"
            value={patientName}
            onChangeText={setPatientName}
          />
          <Label>Required Blood Type</Label>
          <Input
            placeholder="e.g., A+, O-"
            value={bloodType}
            onChangeText={setBloodType}
          />
          <Label>Contact Information</Label>
          <Input
            placeholder="Phone or Email"
            value={contact}
            onChangeText={setContact}
          />
          <Button
            title={loading ? 'Submitting...' : 'Submit Request'}
            onPress={handleRequest}
            disabled={loading}
          />
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});
