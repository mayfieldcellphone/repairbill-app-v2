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
}

const ADMIN_EMAILS = ['mayfieldcellphonerepairs@gmail.com', 'mayfieldphonerepair@gmail.com'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync profile
        let userProfile = await getDocument<AppUser>('users', firebaseUser.uid);
        
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
        setProfile(null);
      }
      
      setLoading(false);
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

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, signInWithEmail, signUpWithEmail }}>
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
