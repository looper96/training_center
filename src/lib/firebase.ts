import { initializeApp, deleteApp, type FirebaseOptions } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** False when the VITE_FIREBASE_* variables were not provided at build time. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

// Initialised lazily-safe: when config is missing the app renders a setup screen and never touches these.
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : (null as never);
export const db = app
  ? initializeFirestore(
      app,
      {
        // Offline cache replaces the old localStorage mirroring: reads are instant and writes queue while offline.
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        ignoreUndefinedProperties: true,
      },
      env.VITE_FIREBASE_DATABASE_ID || '(default)'
    )
  : (null as never);

// Local development / E2E: `VITE_USE_EMULATORS=true` with `npm run emulators`.
if (app && env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Creates a Firebase Auth account for another person without signing the admin out.
 * Uses a short-lived secondary app instance, which has its own auth session.
 */
export async function createAuthAccount(email: string, password: string, displayName: string): Promise<string> {
  const secondary = initializeApp(firebaseConfig, `user-provisioning-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    if (env.VITE_USE_EMULATORS === 'true') connectAuthEmulator(secondaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName });
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}
