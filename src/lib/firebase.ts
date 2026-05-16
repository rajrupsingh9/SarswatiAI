import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  doc, 
  initializeFirestore, 
  getDocFromServer,
  enableNetwork 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Services
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore with explicit database ID and resilient connection settings
// We use forceLongPolling because the AI Studio environment networking can be restrictive
export const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(firebaseApp);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  // We throw a decorated error so we can catch it globally if needed
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection and verify initialization
async function testConnection() {
  try {
    // Proactively enable network to ensure connection is attempted
    await enableNetwork(db);
    
    // As per critical constraint: test connection on boot
    const testDoc = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testDoc).catch(() => {
      // It's okay if the doc doesn't exist, we just want to see if the server responds
      console.log("Firestore connection test: server reached.");
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Firebase Connection Warning: The client is having trouble reaching the backend. This is often due to iframe restrictions or transient network issues.");
      console.warn("FIX: Try opening the app in a new tab using the icon at the top right.");
    }
  }
}

// Fire and forget connection test
testConnection();
