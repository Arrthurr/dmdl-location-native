import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLECTIONS } from './utils/constants';

const ENTRA_TENANT_ID = '31b9c0cb-a928-4266-b427-2820623d7f82';

interface MicrosoftGraphUser {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
}

interface SignInWithMicrosoftRequest {
  accessToken: string;
}

/**
 * Verifies Microsoft access token and creates a Firebase custom token.
 * The client should keep the MS access token for subsequent Graph API calls.
 */
export const signInWithMicrosoft = functions.https.onCall(
  async (request: functions.https.CallableRequest<SignInWithMicrosoftRequest>) => {
    const { accessToken } = request.data;

  if (!accessToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Access token is required');
  }

  try {
    // Verify the token by calling Microsoft Graph API
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!graphResponse.ok) {
      const error = await graphResponse.text();
      console.error('Microsoft Graph API error:', error);
      throw new functions.https.HttpsError('unauthenticated', 'Invalid Microsoft access token');
    }

    const msUser: MicrosoftGraphUser = await graphResponse.json();
    const email = msUser.mail || msUser.userPrincipalName;
    console.log('MS User:', { id: msUser.id, email, displayName: msUser.displayName });

    // Try to find existing user by MS-based UID or by email
    let firebaseUid: string;
    const msBasedUid = `ms_${msUser.id.replace(/-/g, '')}`;
    console.log('Looking for user with MS UID:', msBasedUid);

    try {
      // First, check if user with MS-based UID exists
      const existingMsUser = await admin.auth().getUser(msBasedUid);
      console.log('Found user by MS UID:', existingMsUser.uid);
      firebaseUid = msBasedUid;
      // Update existing user
      await admin.auth().updateUser(firebaseUid, {
        displayName: msUser.displayName,
        email,
      });
      console.log('Updated existing MS user');
    } catch (error: unknown) {
      const authError = error as { code?: string };
      console.log('MS UID lookup error:', authError.code);
      if (authError.code === 'auth/user-not-found') {
        // User with MS UID doesn't exist, check if user with this email exists
        console.log('Looking for user by email:', email);
        try {
          const existingUser = await admin.auth().getUserByEmail(email);
          console.log('Found existing user by email:', existingUser.uid);
          // Use existing user's UID (they may have signed up differently before)
          firebaseUid = existingUser.uid;
          await admin.auth().updateUser(firebaseUid, {
            displayName: msUser.displayName,
          });
          console.log('Updated existing user by email');
        } catch (emailError: unknown) {
          const emailAuthError = emailError as { code?: string };
          console.log('Email lookup error:', emailAuthError.code);
          if (emailAuthError.code === 'auth/user-not-found') {
            // No user exists, create new one with MS-based UID
            console.log('Creating new user with MS UID');
            firebaseUid = msBasedUid;
            await admin.auth().createUser({
              uid: firebaseUid,
              displayName: msUser.displayName,
              email,
            });
            console.log('Created new user');
          } else {
            console.error('Unexpected email lookup error:', emailError);
            throw emailError;
          }
        }
      } else {
        console.error('Unexpected MS UID error:', error);
        throw error;
      }
    }
    console.log('Final firebaseUid:', firebaseUid);

    // Create or update Firestore user document
    const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(firebaseUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        id: firebaseUid,
        email: msUser.mail || msUser.userPrincipalName,
        displayName: msUser.displayName,
        role: 'provider',
        entraId: msUser.id,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await userRef.update({
        displayName: msUser.displayName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Create Firebase custom token
    const customToken = await admin.auth().createCustomToken(firebaseUid, {
      provider: 'microsoft.com',
      tenantId: ENTRA_TENANT_ID,
    });

    return {
      customToken,
      user: {
        uid: firebaseUid,
        email: msUser.mail || msUser.userPrincipalName,
        displayName: msUser.displayName,
        entraId: msUser.id,
      }
    };
  } catch (error) {
    console.error('Error in signInWithMicrosoft:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to sign in with Microsoft');
  }
});
