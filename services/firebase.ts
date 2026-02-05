import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqaTSQyKVoEnYc_KOIciVr5xaAADbFDJw",
  authDomain: "pandora-242ac.firebaseapp.com",
  projectId: "pandora-242ac",
  storageBucket: "pandora-242ac.firebasestorage.app",
  messagingSenderId: "267356116902",
  appId: "1:267356116902:web:5a5c50a261fa0fe4b6a167",
  measurementId: "G-0VD4927562"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with modern persistent cache settings
// This replaces the deprecated enableIndexedDbPersistence()
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
