// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCl3xUrZVKUqVaMptMFlauhNtkldpYcMUE",
  authDomain: "c-meet-platform.firebaseapp.com",
  databaseURL: "https://c-meet-platform-default-rtdb.firebaseio.com",
  projectId: "c-meet-platform",
  storageBucket: "c-meet-platform.firebasestorage.app",
  messagingSenderId: "958273112098",
  appId: "1:958273112098:web:8a747355c9ad7434ae227b",
  measurementId: "G-K1LK8NH0TM"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
