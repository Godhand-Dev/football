/**
 * Firebase Configuration for Livematch Chat
 * Initializing Auth and Firestore services
 */

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCGVQc5OP4k9AXlkK6Ld98yvBmODuc0d60",
  authDomain: "chatapp-5afff.firebaseapp.com",
  databaseURL: "https://chatapp-5afff-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chatapp-5afff",
  storageBucket: "chatapp-5afff.firebasestorage.app",
  messagingSenderId: "835710769608",
  appId: "1:835710769608:web:ae974aeab8745fdea848fd",
  measurementId: "G-V6BH65CXV5"
};

try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDb = db;
