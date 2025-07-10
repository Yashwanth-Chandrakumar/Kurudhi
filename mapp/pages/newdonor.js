import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';

export default function NewDonor({ navigation }) {
    const { user } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [city, setCity] = useState('');

    const handleRegister = async () => {
        if (!name || !bloodGroup || !city) {
            Alert.alert('All fields are required.');
            return;
        }

        try {
            // Check if donor already exists
            const q = query(collection(db, 'donors'), where('Email', '==', user.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                Alert.alert('You are already registered as a donor.');
                navigation.goBack();
                return;
            }

            await addDoc(collection(db, 'donors'), {
                Name: name,
                BloodGroup: bloodGroup,
                City: city,
                Email: user.email,
                lastDonationDate: null,
            });
            Alert.alert('Success', 'You have been registered as a donor.');
            navigation.goBack();
        } catch (error) {
            console.error("Error registering donor:", error);
            Alert.alert('Error', 'Failed to register as a donor. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Become a Donor</Text>
            <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Blood Group (e.g., A+, O-)"
                value={bloodGroup}
                onChangeText={setBloodGroup}
            />
            <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
            />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#b91c1c',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#b91c1c',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
