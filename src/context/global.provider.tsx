import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface GlobalContextType {
  user: UserProfile | null;
  authStatus: AuthStatus;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const GlobalContext = createContext<UserProfile | null>(null);

export const useGlobalAuth = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalAuth must be used within a GlobalProvider');
  }
  return context;
};




export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || null,
          email: firebaseUser.email || null,
          photoURL: firebaseUser.photoURL || null,
        });
        setAuthStatus('authenticated');
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login error:', err);
      setAuthStatus('error');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthStatus('unauthenticated');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <GlobalContext.Provider value={{ user, authStatus, loginWithGoogle, logout }}>
      {children}
    </GlobalContext.Provider>
  );
};