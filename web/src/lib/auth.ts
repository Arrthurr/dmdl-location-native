import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, COLLECTIONS } from '@dmdl/shared';

const ENTRA_TENANT_ID = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID;

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  tenant: ENTRA_TENANT_ID || '',
  prompt: 'select_account',
});
microsoftProvider.addScope('User.Read');

export async function signInWithMicrosoft(): Promise<FirebaseUser> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  try {
    // Use popup for web
    const result = await signInWithPopup(auth, microsoftProvider);

    // Get Microsoft access token for Graph API
    const credential = OAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (accessToken) {
      await ensureUserDocument(result.user, accessToken);
    }

    return result.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/popup-blocked') {
      // Fallback to redirect
      await signInWithRedirect(auth, microsoftProvider);
      throw new Error('Redirecting to Microsoft sign-in...');
    }
    throw error;
  }
}

export async function handleRedirectResult(): Promise<FirebaseUser | null> {
  if (!auth) return null;

  const result = await getRedirectResult(auth);

  if (result) {
    const credential = OAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (accessToken) {
      await ensureUserDocument(result.user, accessToken);
    }

    return result.user;
  }

  return null;
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!auth) {
    // If auth is not configured, call callback with null and return a no-op
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function getUserDocument(userId: string): Promise<User | null> {
  if (!db) return null;

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

async function ensureUserDocument(
  firebaseUser: FirebaseUser,
  accessToken: string
): Promise<void> {
  if (!db) return;

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
  }
}
