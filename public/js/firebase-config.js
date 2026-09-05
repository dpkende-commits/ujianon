// ============================================================
// FIREBASE CONFIG - Jangan commit ke GitHub!
// ============================================================

// Import Firebase SDK (versi modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ============================================================
// 🔑 GANTI DENGAN KONFIGURASI DARI STEP 2
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBKAyShW4wa8tCLHcp3tyft4axBi718TLA",
  authDomain: "pretstdanposttest.firebaseapp.com",
  projectId: "pretstdanposttest",
  storageBucket: "pretstdanposttest.firebasestorage.app",
  messagingSenderId: "553204719947",
  appId: "1:553204719947:web:8848ee07669f611a38c8ce",
  measurementId: "G-CGXE76HXC8"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// EXPOSE KE WINDOW
// ============================================================
window.auth = auth;
window.db = db;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.collection = collection;
window.query = query;
window.where = where;
window.deleteDoc = deleteDoc;
window.updateDoc = updateDoc;
window.addDoc = addDoc;

console.log('🔥 Firebase siap digunakan!');