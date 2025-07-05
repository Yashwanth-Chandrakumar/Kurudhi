import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/constants/FirebaseConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/hooks/useSession';

const db = getFirestore(app);

export default function Profile() {
  const { session } = useSession();
  const [name, setName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!session) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'donors', session.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setBloodType(data.bloodType);
          setContact(data.contact);
        }
      } catch (error) {
        Alert.alert('Error', 'Could not fetch profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  const handleUpdate = async () => {
    if (!session) {
      Alert.alert('Error', 'You must be logged in to update your profile.');
      return;
    }

    setUpdating(true);
    try {
      await setDoc(doc(db, 'donors', session.uid), {
        name,
        bloodType,
        contact,
      });
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
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
            title={updating ? 'Updating...' : 'Update Profile'}
            onPress={handleUpdate}
            disabled={updating}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
