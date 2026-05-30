import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_YYYPlskKtC_LEed63_ZGlSJeA_1UhuI",
  authDomain: "trading-jurnal-deo.firebaseapp.com",
  projectId: "trading-jurnal-deo",
  storageBucket: "trading-jurnal-deo.firebasestorage.app",
  messagingSenderId: "1085442544675",
  appId: "1:1085442544675:web:2bad6464f7be4673de8d96",
  measurementId: "G-NR89QZDXEE",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
