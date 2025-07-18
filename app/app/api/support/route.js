import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request) {
  try {
    const supportCollection = collection(db, 'support');
    const supportSnapshot = await getDocs(supportCollection);
    const supportList = supportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(supportList);
  } catch (error) {
    console.error('Error fetching support requests:', error);
    return NextResponse.json({ message: 'Failed to fetch support requests' }, { status: 500 });
  }
}
