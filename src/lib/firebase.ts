import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error("This domain is not authorized for OAuth operations. Please add your custom domain (e.g., repairbill.shop) to the Authorized Domains list in the Firebase Console (Authentication > Settings > Authorized domains).");
    }
    if (error.code === 'auth/internal-error' || error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      throw new Error("Login failed. If you are on a custom domain, ensure it is added to Firebase Authentication > Authorized Domains. Otherwise, your browser may be blocking the popup.");
    }
    throw error;
  }
}

// Connection verification removed to prevent false startup error banners.

