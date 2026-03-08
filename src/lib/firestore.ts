import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  type DocumentData, type QueryConstraint, type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS, SUB_COLLECTIONS } from '@/constants/firestore'

// Generic helpers
export async function fetchCollection<T>(
  path: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, path), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

export async function fetchDoc<T>(path: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

// Firestore rejects `undefined` values — strip them before writing
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

export async function createDoc<T extends DocumentData>(
  path: string,
  data: T
): Promise<string> {
  const ref = await addDoc(collection(db, path), stripUndefined({
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  return ref.id
}

export async function updateDocById(
  path: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, path, id), stripUndefined({ ...data, updatedAt: serverTimestamp() }))
}

export async function deleteDocById(path: string, id: string): Promise<void> {
  await deleteDoc(doc(db, path, id))
}

export function subscribeToCollection<T>(
  path: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, path), ...constraints)
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as T)))
  })
}

// Business-specific helpers
export const businessPath = (businessId: string) =>
  `${COLLECTIONS.BUSINESSES}/${businessId}`

export const subColPath = (
  businessId: string,
  subCol: string
) => `${businessPath(businessId)}/${subCol}`

export { where, orderBy, limit, serverTimestamp, COLLECTIONS, SUB_COLLECTIONS }
