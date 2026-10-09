import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import logger from '../logger';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export class AuthManager {
  private user: UserProfile | null = null;
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        this.user = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || null,
          email: firebaseUser.email || null,
          photoURL: firebaseUser.photoURL || null,
        };
      } else {
        this.user = null;
      }
    });
    this.initialized = true;
  }

  getCurrentUser(): UserProfile | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  async loginWithGoogle(): Promise<UserProfile | null> {
    try {
      logger.logAuthEvent('AuthManager', 'loginWithGoogle.start');
      const result = await signInWithPopup(auth, googleProvider);
      this.user = {
        uid: result.user.uid,
        displayName: result.user.displayName || null,
        email: result.user.email || null,
        photoURL: result.user.photoURL || null,
      };
      logger.logAuthEvent('AuthManager', 'loginWithGoogle.success', 'info', { userId: this.user?.uid });
      return this.user;
    } catch (err) {
      logger.logAuthEvent('AuthManager', 'loginWithGoogle.error', 'error', { error: err });
      console.error('Google login error:', err);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      logger.logAuthEvent('AuthManager', 'logout.start');
      await signOut(auth);
      this.user = null;
      logger.logAuthEvent('AuthManager', 'logout.success', 'info');
    } catch (err) {
      logger.logAuthEvent('AuthManager', 'logout.error', 'error', { error: err });
      console.error('Logout error:', err);
      throw err;
    }
  }
}