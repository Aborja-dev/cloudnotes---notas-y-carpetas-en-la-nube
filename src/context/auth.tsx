
import { createContext } from "vm";
import { auth, googleProvider, signInWithPopup, signOut } from "../firebase";
import logger from "../logger";

type AuthService = {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const firebaseAuth: AuthService = {
  loginWithGoogle: async () => {
    try {
      logger.logAuthEvent('firebaseAuth', 'loginWithGoogle.start');
      await signInWithPopup(auth, googleProvider);
      logger.logAuthEvent('firebaseAuth', 'loginWithGoogle.success', 'info');
    } catch (error) {
      logger.logAuthEvent('firebaseAuth', 'loginWithGoogle.error', 'error', { error });
      console.error("Error al iniciar sesión con Google", error);
    }
  },
  logout: async () => {
    try {
      logger.logAuthEvent('firebaseAuth', 'logout.start');
      await signOut(auth);
      logger.logAuthEvent('firebaseAuth', 'logout.success', 'info');
    } catch (error) {
      logger.logAuthEvent('firebaseAuth', 'logout.error', 'error', { error });
      console.error("Error al cerrar sesión", error);
    }
  },
};

const mockAuth: AuthService = {
  loginWithGoogle: async () => {
    try {
      logger.logAuthEvent('mockAuth', 'loginWithGoogle.start');
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log("Login Google");
          logger.logAuthEvent('mockAuth', 'loginWithGoogle.success', 'info');
          resolve();
        }, 1000);
      });
    } catch (error) {
      logger.logAuthEvent('mockAuth', 'loginWithGoogle.error', 'error', { error });
      console.error("Error al iniciar sesión con Google", error);
    }
  },
  logout: async () => {
    try {
      logger.logAuthEvent('mockAuth', 'logout.start');
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log("Logout");
          logger.logAuthEvent('mockAuth', 'logout.success', 'info');
          resolve();
        }, 1000);
    });
    } catch (error) {
      logger.logAuthEvent('mockAuth', 'logout.error', 'error', { error });
      console.error("Error al cerrar sesión", error);
    }
  },
};


const AuthContext = createContext<AuthService | null>(null);

interface AuthProviderProps {
    children: React.ReactNode;
    authService: AuthService;
}

const AuthProvider = ({ children, authService }: AuthProviderProps) => {
    return (
        <AuthContext.Provider value={authService}>
            {children}
        </AuthContext.Provider>
    )
}

export { firebaseAuth, mockAuth, AuthContext, AuthProvider };