import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  
    apiKey: "AIzaSyAugW8g37LhvRumYf3L0xhs5gJZtXl0qe0",

    authDomain: "rose-surveys.firebaseapp.com",
  
    projectId: "rose-surveys",
  
    storageBucket: "rose-surveys.appspot.com",
  
    messagingSenderId: "507934145772",
  
    appId: "1:507934145772:web:e5e31f35aa9810a9c4f9c9"
  
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);