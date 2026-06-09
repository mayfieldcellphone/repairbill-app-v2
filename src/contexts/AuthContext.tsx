import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { auth, signInWithGoogle } from '../lib/firebase';
import { getDocument, saveDocument } from '../lib/firestore';
import { AppUser } from '../lib/types';

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
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
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: isAdmin ? 'admin' : 'user',
              status: isAdmin ? 'active' : 'pending',
              apiKey: `rb_fallback_${Math.random().toString(36).substring(2)}`,
              createdAt: new Date().toISOString()
            };
          }
          
          if (!userProfile) {
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: isAdmin ? 'admin' : 'user',
              status: isAdmin ? 'active' : 'pending',
              apiKey: `rb_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
              createdAt: new Date().toISOString()
            };
            await saveDocument('users', firebaseUser.uid, userProfile);
            
            if (isAdmin) {
               await saveDocument('admins', firebaseUser.uid, userProfile);
            }
          } else {
            // Ensure every user has an API Key
            if (!userProfile.apiKey) {
               userProfile.apiKey = `rb_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
               await saveDocument('users', firebaseUser.uid, userProfile);
            }
            
            if (ADMIN_EMAILS.includes(firebaseUser.email || '') && (userProfile.role !== 'admin' || userProfile.status !== 'active')) {
              // Self-heal admin status if email is in the hardcoded admin list
              userProfile = {
                ...userProfile,
                role: 'admin',
                status: 'active'
              };
              await saveDocument('users', firebaseUser.uid, userProfile);
              await saveDocument('admins', firebaseUser.uid, userProfile);
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

  const signInDemo = (email: string = 'mayfieldcellphonerepairs@gmail.com', name: string = 'Mayfield Repair Store') => {
    const mockUser = {
      uid: 'demo-user-id-' + Math.random().toString(36).substring(2, 7),
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, signInWithEmail, signUpWithEmail, signInDemo }}>
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
