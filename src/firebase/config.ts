import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoApiKeyForAttendanceTracker123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "attendance-tracker-demo.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://attendance-tracker-demo-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "attendance-tracker-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "attendance-tracker-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Check if Firebase is configured with real non-placeholder key
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('DemoApiKey')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  database = getDatabase(app);
} catch (error) {
  console.warn("Firebase initialization warning (using local fallback mode):", error);
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, database };
