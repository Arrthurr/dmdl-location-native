import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Constants from 'expo-constants';
import { auth, db, functions } from './firebase';
import { User, COLLECTIONS } from '@dmdl/shared';

// Complete any pending auth session
WebBrowser.maybeCompleteAuthSession();

const ENTRA_TENANT_ID =
  Constants.expoConfig?.extra?.entraTenantId ||
  process.env.EXPO_PUBLIC_ENTRA_TENANT_ID;
const ENTRA_CLIENT_ID =
  Constants.expoConfig?.extra?.entraClientId ||
  process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID;

// Entra ID OAuth endpoints
const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/oauth2/v2.0/token`,
};

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'dmdl-locator',
  path: 'auth',
});

export function useEntraAuthRequest() {
  return AuthSession.useAuthRequest(
    {
      clientId: ENTRA_CLIENT_ID || '',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<AuthSession.TokenResponse> {
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: ENTRA_CLIENT_ID || '',
      code,
      redirectUri,
      extraParams: {
        code_verifier: codeVerifier,
      },
    },
    discovery
  );
  return tokenResponse;
}

// Store for MS access token (for Graph API calls)
let msAccessToken: string | null = null;

export function getMicrosoftAccessToken(): string | null {
  return msAccessToken;
}

export async function signInWithMicrosoftToken(
  _idToken: string,
  accessToken: string
): Promise<FirebaseUser> {
  // Store the MS access token for later Graph API calls
  msAccessToken = accessToken;

  // Call Cloud Function to verify token and get Firebase custom token
  const signInWithMicrosoft = httpsCallable<
    { accessToken: string },
    { customToken: string; user: { uid: string; email: string; displayName: string } }
  >(functions, 'signInWithMicrosoft');

  const result = await signInWithMicrosoft({ accessToken });
  const { customToken } = result.data;

  // Sign in to Firebase with custom token
  const userCredential = await signInWithCustomToken(auth, customToken);

  return userCredential.user;
}

export async function getUserDocument(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  msAccessToken = null;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
