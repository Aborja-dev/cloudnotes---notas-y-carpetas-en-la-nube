/**
 * Auth flow plan and composed services for CloudNotes.
 *
 * This file orchestrates the login/logout flow with structured logging.
 * Three layers:
 *  1. Pure service functions representing the steps to do login
 *  2. Component flow serving a sequence of steps as actions
 *  3. Manager hook to handle state, coordinate the flow, get data and keep listening
 */

import logger from "../logger";
import { firebaseAuth, mockAuth } from "../context/auth";

// ============================================================
// Layer 1: Pure service functions representing the steps to do login
// ============================================================

export type AuthAction = 'loginWithGoogle.start' | 'loginWithGoogle.success' | 'loginWithGoogle.error' | 'logout.start' | 'logout.success' | 'logout.error';

interface AuthEvent {
  action: AuthAction;
  timestamp: number;
  userId?: string;
  error?: unknown;
}

const authEvents: AuthEvent[] = [];

export function logAuthAction(action: AuthAction, userId?: string, error?: unknown): void {
  const event: AuthEvent = {
    action,
    timestamp: Date.now(),
    userId,
    error,
  };
  authEvents.push(event);
  logger.logAuthEvent('featuresAuth', action, error ? 'error' : 'info', {
    userId,
    error,
  });
}

// ============================================================
// Layer 2: Component flow - sequence of steps as actions
// ============================================================

export const loginFlow = {
  /** Step 1: Initiate Google login */
  async start(): Promise<UserProfile | null> => {
    logAuthAction('loginWithGoogle.start');
    const result = await firebaseAuth.loginWithGoogle();
    logAuthAction('loginWithGoogle.success', result?.uid);
    return result;
  },

  /** Step 2: Handle login failure */
  async handleError(error: unknown): Promise<void> {
    logAuthAction('loginWithGoogle.error', undefined, error);
    throw error;
  },

  /** Step 3: Initiate logout */
  async logout(): Promise<void> {
    logAuthAction('logout.start');
    await firebaseAuth.logout();
    logAuthAction('logout.success');
  },
};

export const signupFlow = {
  /** Not implemented - placeholder for future auth flows */
  async start(): Promise<void> {
    logAuthAction('signup.start');
    // TODO: implement sign-up flow
    logAuthAction('signup.success');
  },
};

// ============================================================
// Layer 3: Manager hook - handles state, coordinates flow, gets data, listens
// ============================================================

export type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export interface AuthService {
  /** Login with Google - returns user profile or null */
  loginWithGoogle: () => Promise<UserProfile | null>;
  /** Log out - returns void */
  logout: () => Promise<void>;
  /** Get current authenticated user */
  getCurrentUser: () => UserProfile | null;
  /** Check if user is authenticated */
  isAuthenticated: () => boolean;
}

/** Composed auth service with logging and state management */
export const authService: AuthService = {
  privateAuthState: null as UserProfile | null,
  privateAuthStateListeners: [] as ((user: UserProfile | null) => void)[],

  onAuthStateChanged: (callback: (user: UserProfile | null) => void): () => void => {
    authService.privateAuthStateListeners.push(callback);
    // Immediately call with current state
    callback(authService.privateAuthState);
    // Return unsubscribe function
    return () => {
      authService.privateAuthStateListeners = authService.privateAuthStateListeners.filter(
        (listener) => listener !== callback
      );
    };
  },

  /** Get the current authenticated user profile */
  getAuthState: (): UserProfile | null => {
    return authService.privateAuthState;
  },

  loginWithGoogle: async (): Promise<UserProfile | null> => {
    try {
      logAuthAction('loginWithGoogle.start');
      const userProfile = await firebaseAuth.loginWithGoogle();
      
      if (userProfile) {
        // Convert Firebase user to our UserProfile format
        const profile: UserProfile = {
          uid: userProfile.uid,
          displayName: userProfile.displayName || 'Usuario',
          email: userProfile.email || null,
          photoURL: userProfile.photoURL || null,
        };
        
        // Update internal auth state
        authService.privateAuthState = profile;
        logAuthAction('loginWithGoogle.success', profile.uid);
      } else {
        authService.privateAuthState = null;
      }
      
      // Notify all listeners of the auth state change
      authService.notifyAuthStateChanged();
      return authService.privateAuthState;
    } catch (error) {
      authService.privateAuthState = null;
      logAuthAction('loginWithGoogle.error', undefined, error);
      authService.notifyAuthStateChanged();
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      logAuthAction('logout.start');
      await firebaseAuth.logout();
      // Clear internal auth state
      authService.privateAuthState = null;
      logAuthAction('logout.success');
      // Notify all listeners of the auth state change
      authService.notifyAuthStateChanged();
    } catch (error) {
      authService.privateAuthState = null;
      logAuthAction('logout.error', undefined, error);
      authService.notifyAuthStateChanged();
      throw error;
    }
  },

  getCurrentUser: (): UserProfile => {
    // Return the current auth state or default mock
    const user = authService.privateAuthState;
    if (user && user.uid) {
      return user;
    }
    // Fallback to mock data
    return {
      uid: 'current-user',
      displayName: 'Usuario',
      email: 'user@example.com',
      photoURL: null,
    };
  },

  isAuthenticated: (): boolean => {
    // Check if we have a user profile with a uid in internal state
    const user = authService.privateAuthState;
    return !!user?.uid;
  },

  private notifyAuthStateChanged: () => {
    authService.privateAuthStateListeners.forEach((callback) => {
      callback(authService.privateAuthState);
    });
  },
};

// Export the original context auth services for direct use
export { firebaseAuth, mockAuth };

// Export the auth events array for debugging/inspection
export { authEvents };