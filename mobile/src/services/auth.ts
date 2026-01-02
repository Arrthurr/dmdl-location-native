import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  signInWithCredential,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Constants from 'expo-constants';
import { auth, db } from './firebase';
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

export async function signInWithMicrosoftToken(
  idToken: string,
  accessToken: string
): Promise<FirebaseUser> {
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({
    tenant: ENTRA_TENANT_ID || '',
  });

  const credential = provider.credential({
    idToken,
    accessToken,
  });

  const userCredential = await signInWithCredential(auth, credential);

  // Create or update user document
  await ensureUserDocument(userCredential.user, accessToken);

  return userCredential.user;
}

async function ensureUserDocument(
  firebaseUser: FirebaseUser,
  accessToken: string
): Promise<void> {
  try {
    // Fetch user info from Microsoft Graph
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const graphUser = await graphResponse.json();

    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // New user - create document with default provider role
      await setDoc(userRef, {
        id: firebaseUser.uid,
        email: firebaseUser.email || graphUser.mail || graphUser.userPrincipalName,
        displayName: graphUser.displayName || firebaseUser.displayName || 'Unknown',
        role: 'provider', // Default role - admin can upgrade
        entraId: graphUser.id,
        photoUrl: firebaseUser.photoURL,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing user
      await setDoc(
        userRef,
        {
          displayName: graphUser.displayName || firebaseUser.displayName,
          photoUrl: firebaseUser.photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Error ensuring user document:', error);
    // Don't throw - user can still use the app
  }
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
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
