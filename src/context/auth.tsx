
import { createContext } from "vm";
import { auth, googleProvider, signInWithPopup, signOut } from "../firebase";

type AuthService = {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const firebaseAuth: AuthService = {
  loginWithGoogle: async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Error al iniciar sesión con Google", error);
    }
  },
  logout: async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error al cerrar sesión", error);
    }
  },
};

const mockAuth: AuthService = {
  loginWithGoogle: async () => {
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log("Login Google");
          resolve();
        }, 1000);
      });
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
    }
  },
  logout: async () => {
    try {
        await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log("Logout");
          resolve();
        }, 1000);
    });
    } catch (error) {
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