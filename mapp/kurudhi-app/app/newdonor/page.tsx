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

export default function NewDonor() {
  const { session } = useSession();
  const [name, setName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!session) {
      Alert.alert('Error', 'You must be logged in to register as a donor.');
      return;
    }

    if (!name || !bloodType || !contact) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'donors'), {
        uid: session.uid,
        name,
        bloodType,
        contact,
      });
      Alert.alert('Success', 'You have been registered as a donor.');
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
          <CardTitle>Register as a Donor</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Name</Label>
          <Input
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <Label>Blood Type</Label>
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
            title={loading ? 'Registering...' : 'Register'}
            onPress={handleRegister}
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
