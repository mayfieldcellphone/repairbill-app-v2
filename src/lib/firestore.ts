import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  FirestoreError,
  DocumentData,
  QueryConstraint,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getDocuments<T>(collectionPath: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
  try {
    const q = query(collection(db, collectionPath), ...queryConstraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return [];
  }
}

export async function getDocument<T>(collectionPath: string, id: string): Promise<T | null> {
  const path = `${collectionPath}/${id}`;
  try {
    const docSnap = await getDoc(doc(db, collectionPath, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToDocuments<T>(
  collectionPath: string, 
  onUpdate: (data: T[]) => void,
  ...queryConstraints: QueryConstraint[]
) {
  const q = query(collection(db, collectionPath), ...queryConstraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    onUpdate(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  });
}

export async function saveDocument(collectionPath: string, id: string, data: any) {
  const path = `${collectionPath}/${id}`;
  
  const cleanUndefined = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  };
  
  try {
    await setDoc(doc(db, collectionPath, id), cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveDocumentsBatch(collectionPath: string, items: { id: string, data: any }[]) {
  const CHUNK_SIZE = 500; // Firestore limit per batch
  
  const cleanUndefined = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  };

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    
    chunk.forEach(item => {
      const docRef = doc(db, collectionPath, item.id);
      batch.set(docRef, cleanUndefined(item.data));
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionPath + ' (batch)');
    }
  }
}

export async function removeDocument(collectionPath: string, id: string) {
  const path = `${collectionPath}/${id}`;
  try {
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
