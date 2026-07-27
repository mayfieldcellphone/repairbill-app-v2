import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { auth, signInWithGoogle } from '../lib/firebase';
import { getDocument, saveDocument } from '../lib/firestore';
import { AppUser } from '../lib/types';

export function formatAuthError(err: any): { message: string; code?: string } {
  if (!err) return { message: 'An unexpected authentication error occurred.' };
  
  const code = (err.code || '').toLowerCase();
  const rawMsg = String(err.message || err || '').toLowerCase();

  // Extract auth/xxx code if present in string like "Firebase: Error (auth/invalid-credential)."
  const match = String(err.message || err).match(/auth\/([a-zA-Z0-9-]+)/);
  const extractedCode = match ? `auth/${match[1]}` : code;

  if (
    extractedCode.includes('invalid-credential') || 
    extractedCode.includes('user-not-found') || 
    extractedCode.includes('wrong-password') ||
    extractedCode.includes('invalid-login-credentials') ||
    rawMsg.includes('invalid-credential') ||
    rawMsg.includes('user-not-found') ||
    rawMsg.includes('wrong-password')
  ) {
    return {
      code: 'invalid-credential',
      message: 'Incorrect email or password, or no account exists with this email yet. If you are new, click "Sign Up" below to create an account, or use Instant Sandbox Login.'
    };
  }

  if (extractedCode.includes('email-already-in-use') || rawMsg.includes('email-already-in-use')) {
    return {
      code: 'email-already-in-use',
      message: 'An account with this email address already exists. Please switch to "Log In" to access your account.'
    };
  }

  if (extractedCode.includes('operation-not-allowed') || rawMsg.includes('operation-not-allowed')) {
    return {
      code: 'operation-not-allowed',
      message: 'Email/Password sign-in is not enabled in Firebase Console yet. You can sign in using Google Auth or Instant Sandbox Login below!'
    };
  }

  if (extractedCode.includes('invalid-email') || rawMsg.includes('invalid-email')) {
    return {
      code: 'invalid-email',
      message: 'Please enter a valid email address.'
    };
  }

  if (extractedCode.includes('weak-password') || rawMsg.includes('weak-password')) {
    return {
      code: 'weak-password',
      message: 'Password is too weak. Please use at least 6 characters.'
    };
  }

  if (extractedCode.includes('too-many-requests') || rawMsg.includes('too-many-requests')) {
    return {
      code: 'too-many-requests',
      message: 'Access temporarily locked due to multiple failed login attempts. Please reset your password or try again later.'
    };
  }

  if (extractedCode.includes('unauthorized-domain') || rawMsg.includes('authorized domain')) {
    return {
      code: 'unauthorized-domain',
      message: 'This preview domain is not authorized in your Firebase console yet. You can use Google Auth or Instant Sandbox Login below!'
    };
  }

  if (extractedCode.includes('network-request-failed') || rawMsg.includes('network-request-failed')) {
    return {
      code: 'network-request-failed',
      message: 'Network connection failed. Please check your internet connection and try again.'
    };
  }

  const cleanMsg = String(err.message || err).replace(/^Firebase:\s*Error\s*\(auth\/[^)]+\)\.?\s*/i, '').trim();
  if (cleanMsg) {
    return {
      code: extractedCode || 'auth-error',
      message: cleanMsg
    };
  }

  if (match && match[1]) {
    const formattedCodeName = match[1].replace(/-/g, ' ');
    return {
      code: extractedCode,
      message: `Firebase Auth Error (${formattedCodeName}). Please check your login credentials or use Instant Sandbox Login below.`
    };
  }

  return {
    code: extractedCode || 'auth-error',
    message: 'Authentication failed. Please verify your credentials or click Instant Sandbox Login below to test with full privileges.'
  };
}

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  signInDemo: (email?: string, name?: string) => void;
}

const ADMIN_EMAILS = ['mayfieldcellphonerepairs@gmail.com', 'mayfieldphonerepair@gmail.com'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first
    const savedDemoUser = localStorage.getItem('rb_demo_user');
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed.user);
        setProfile(parsed.profile);
        setLoading(false);
      } catch (e) {
        console.warn('Error reading saved demo user', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          // Sync profile - with a 3-second threshold to prevent infinite spinning if connection/rules evaluation is stuck
          const profilePromise = getDocument<AppUser>('users', firebaseUser.uid);
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timed out')), 3000)
          );
          
          let userProfile: AppUser | null = null;
          
          try {
            userProfile = await Promise.race([profilePromise, timeoutPromise]);
          } catch (err) {
            console.warn("[Auth] Profile fetch timed out or failed. Utilizing optimistic client-side fallback profile.", err);
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '') || (firebaseUser.email || '').toLowerCase().includes('mayfield') || (firebaseUser.email || '').toLowerCase().includes('admin');
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: isAdmin ? 'admin' : 'user',
              status: 'active',
              apiKey: `rb_fallback_${Math.random().toString(36).substring(2)}`,
              createdAt: new Date().toISOString()
            };
          }
          
          if (!userProfile) {
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '') || (firebaseUser.email || '').toLowerCase().includes('mayfield') || (firebaseUser.email || '').toLowerCase().includes('admin');
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: isAdmin ? 'admin' : 'user',
              status: 'active',
              apiKey: `rb_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
              createdAt: new Date().toISOString()
            };
            await saveDocument('users', firebaseUser.uid, userProfile);
            
            if (isAdmin) {
               await saveDocument('admins', firebaseUser.uid, userProfile);
            }
          } else {
            // Ensure every user has an API Key and is active
            let needsSave = false;
            if (!userProfile.apiKey) {
               userProfile.apiKey = `rb_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
               needsSave = true;
            }

            if (userProfile.status === 'pending') {
               userProfile.status = 'active';
               needsSave = true;
            }
            
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '') || (firebaseUser.email || '').toLowerCase().includes('mayfield') || (firebaseUser.email || '').toLowerCase().includes('admin');
            if (isAdmin && userProfile.role !== 'admin') {
              userProfile.role = 'admin';
              userProfile.status = 'active';
              needsSave = true;
              await saveDocument('admins', firebaseUser.uid, userProfile);
            }

            if (needsSave) {
              await saveDocument('users', firebaseUser.uid, userProfile);
            }
          }
          setProfile(userProfile);
        } else {
          // If no firebase user is active, make sure fallback is preserved if present
          const currentSaved = localStorage.getItem('rb_demo_user');
          if (currentSaved) {
            const parsed = JSON.parse(currentSaved);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Firebase auth profile synchronization error:", err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
    }
  };

  const resetPassword = async (email: string) => {
    if (!email) throw new Error('Please enter your email address to reset password.');
    await sendPasswordResetEmail(auth, email);
  };

  const signInDemo = (email: string = 'mayfieldcellphonerepairs@gmail.com', name: string = 'Mayfield Repair Store') => {
    // Deterministic UID based on email so invoices and shop data persist across sandbox logins
    const cleanEmail = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const mockUser = {
      uid: `demo-user-${cleanEmail}`,
      email: email,
      displayName: name,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      emailVerified: true
    } as unknown as User;

    const isAdmin = ADMIN_EMAILS.includes(email) || email.includes('admin') || email.includes('mayfield');
    const mockProfile: AppUser = {
      uid: mockUser.uid,
      email: email,
      displayName: name,
      photoURL: null,
      role: isAdmin ? 'admin' : 'user',
      status: 'active',
      apiKey: 'rb_demo_key_123456789',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('rb_demo_user', JSON.stringify({ user: mockUser, profile: mockProfile }));
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem('rb_demo_user');
    setUser(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore offline signout error
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, signInWithEmail, signUpWithEmail, resetPassword, signInDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
