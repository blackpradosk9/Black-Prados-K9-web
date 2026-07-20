import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvrwAHUjY5SMMQmmZ3FXCRuRVBUx8bG8k",
  authDomain: "gen-lang-client-0377431116.firebaseapp.com",
  projectId: "gen-lang-client-0377431116",
  storageBucket: "gen-lang-client-0377431116.firebasestorage.app",
  messagingSenderId: "113623158180",
  appId: "1:113623158180:web:c315cf97b08dec585c0531",
  firestoreDatabaseId: "ai-studio-79871270-2486-4081-9ca3-8d4d6134a651"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
