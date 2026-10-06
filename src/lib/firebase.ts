import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, type Firestore } from "firebase/firestore";

function getEnvValue(primaryKey: string, legacyKey?: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[primaryKey] ?? (legacyKey ? env[legacyKey] : undefined);
}

const firebaseConfig = {
  apiKey: getEnvValue("FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY"),
  authDomain: getEnvValue("FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvValue("FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvValue("FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvValue("FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvValue("FIREBASE_APP_ID", "VITE_FIREBASE_APP_ID"),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Add FIREBASE_* variables to .env");
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    // In-memory cache only: avoids offline persistence reconnect reads (lower usage).
    db = initializeFirestore(getFirebaseApp(), {
      localCache: memoryLocalCache(),
    });
  }
  return db;
}
