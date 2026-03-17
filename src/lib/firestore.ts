import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  type DocumentData, type QueryConstraint, type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS, SUB_COLLECTIONS } from '@/constants/firestore'

// Returns true when the path targets a demo business — skip real Firestore
function isDemoPath(path: string): boolean {
  return path.includes('demo-biz-') || path.includes('demo-uid-')
}

// ── In-memory demo store ────────────────────────────────────────────────────
// Mimics Firestore's subscribe/notify pattern for demo mode so CRUD is visible.
type DemoRecord = Record<string, unknown> & { id: string }
const demoStore   = new Map<string, DemoRecord[]>()
const demoListeners = new Map<string, Set<(items: DemoRecord[]) => void>>()

function demoNotify(path: string) {
  const items = demoStore.get(path) ?? []
  demoListeners.get(path)?.forEach(cb => cb(items))
}

function demoSubscribe<T>(path: string, callback: (data: T[]) => void): () => void {
  if (!demoListeners.has(path)) demoListeners.set(path, new Set())
  const cb = (items: DemoRecord[]) => callback(items as T[])
  demoListeners.get(path)!.add(cb)
  callback((demoStore.get(path) ?? []) as T[])
  return () => { demoListeners.get(path)?.delete(cb) }
}

function demoCreate<T extends Record<string, unknown>>(path: string, data: T): string {
  const id = `demo-doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const now = new Date().toISOString()
  const record: DemoRecord = { ...data, id, createdAt: now, updatedAt: now }
  const list = demoStore.get(path) ?? []
  demoStore.set(path, [...list, record])
  demoNotify(path)
  return id
}

function demoUpdate(path: string, id: string, data: Record<string, unknown>) {
  const list = demoStore.get(path) ?? []
  demoStore.set(path, list.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r))
  demoNotify(path)
}

function demoDelete(path: string, id: string) {
  const list = demoStore.get(path) ?? []
  demoStore.set(path, list.filter(r => r.id !== id))
  demoNotify(path)
}

// Generic helpers
export async function fetchCollection<T>(
  path: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  if (isDemoPath(path)) return (demoStore.get(path) ?? []) as T[]
  try {
    const q = query(collection(db, path), ...constraints)
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
  } catch {
    return []
  }
}

export async function fetchDoc<T>(path: string, id: string): Promise<T | null> {
  if (isDemoPath(path) || isDemoPath(id)) return null
  try {
    const snap = await getDoc(doc(db, path, id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as T
  } catch {
    return null
  }
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
  if (isDemoPath(path)) return demoCreate(path, data as Record<string, unknown>)
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
  if (isDemoPath(path) || isDemoPath(id)) { demoUpdate(path, id, data as Record<string, unknown>); return }
  await updateDoc(doc(db, path, id), stripUndefined({ ...data, updatedAt: serverTimestamp() }))
}

export async function deleteDocById(path: string, id: string): Promise<void> {
  if (isDemoPath(path) || isDemoPath(id)) { demoDelete(path, id); return }
  await deleteDoc(doc(db, path, id))
}

export function subscribeToCollection<T>(
  path: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  if (isDemoPath(path)) return demoSubscribe(path, callback)
  const q = query(collection(db, path), ...constraints)
  return onSnapshot(
    q,
    snap => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))) },
    _err  => { callback([]) }   // permission-denied or other errors: return empty silently
  )
}

// Business-specific helpers
export const businessPath = (businessId: string) =>
  `${COLLECTIONS.BUSINESSES}/${businessId}`

export const subColPath = (
  businessId: string,
  subCol: string
) => businessId ? `${businessPath(businessId)}/${subCol}` : ''

export { where, orderBy, limit, serverTimestamp, COLLECTIONS, SUB_COLLECTIONS }
