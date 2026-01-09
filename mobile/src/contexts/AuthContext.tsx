import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@dmdl/shared';
import {
  useEntraAuthRequest,
  exchangeCodeForToken,
  signInWithMicrosoftToken,
  getUserDocument,
  signOut as authSignOut,
  subscribeToAuthState,
} from '@/services/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = useEntraAuthRequest();

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userDoc = await getUserDocument(fbUser.uid);
        setUser(userDoc);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle auth response
  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      const { code } = response.params;
      handleAuthSuccess(code, request.codeVerifier);
    }
  }, [response, request?.codeVerifier]);

  const handleAuthSuccess = async (code: string, codeVerifier: string) => {
    try {
      setIsLoading(true);

      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

      if (!tokenResponse.idToken || !tokenResponse.accessToken) {
        throw new Error('Missing tokens from auth response');
      }

      // Sign in to Firebase with Microsoft credential
      await signInWithMicrosoftToken(
        tokenResponse.idToken,
        tokenResponse.accessToken
      );

      // User state will be updated by the auth state listener
    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signIn = useCallback(async () => {
    const result = await promptAsync();
    if (result.type !== 'success') {
      throw new Error('Authentication was cancelled or failed');
    }
    // The useEffect above will handle the successful response
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
