import { useEffect } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut as fbSignOut,
  sendPasswordResetEmail, updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { isDemoMode, DEMO_USER } from '@/lib/demoMode'
import type { AuthUser, LoginCredentials, Plan } from '@/types/auth.types'
import type { IndustryType } from '@/types/industry.types'
import { COLLECTIONS } from '@/constants/firestore'

function mapFirebaseUser(
  fbUser: FirebaseUser,
  extra: Partial<AuthUser> = {}
): AuthUser {
  return {
    uid:              fbUser.uid,
    email:            fbUser.email || '',
    displayName:      fbUser.displayName,
    photoURL:         fbUser.photoURL,
    emailVerified:    fbUser.emailVerified,
    role:             extra.role || 'business_owner',
    businessId:       extra.businessId || null,
    plan:             extra.plan || 'starter',
    industryType:     extra.industryType || null,
    stripeCustomerId: extra.stripeCustomerId || null,
    createdAt:        extra.createdAt || new Date(),
  }
}

export function useAuthInit() {
  const { setUser, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    // Demo mode: skip Firebase entirely
    if (isDemoMode()) {
      setLoading(false)
      setInitialized(true)
      // Don't auto-login — let user click through login page
      // but if there's already a user in the store, keep it
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, COLLECTIONS.USERS, fbUser.uid))
          const extra = snap.exists() ? snap.data() : {}
          // If Firestore doesn't have businessId yet (e.g. still writing),
          // fall back to the deterministic biz_{uid} so no user ever gets null
          if (!extra.businessId) {
            extra.businessId = `biz_${fbUser.uid}`
          }
          setUser(mapFirebaseUser(fbUser, extra as Partial<AuthUser>))
        } catch {
          // On error, still set a valid businessId so queries are scoped correctly
          setUser(mapFirebaseUser(fbUser, { businessId: `biz_${fbUser.uid}` }))
        }
      } else {
        setUser(null)
      }
      setLoading(false)
      setInitialized(true)
    })
    return unsubscribe
  }, [setUser, setLoading, setInitialized])
}

export function useAuth() {
  const { user, isLoading, signOut: clearUser, setUser } = useAuthStore()

  async function login({ email, password }: LoginCredentials) {
    // Demo mode — skip Firebase, inject mock user
    if (isDemoMode()) {
      const demoUser = { ...DEMO_USER, email }
      setUser(demoUser)
      return demoUser
    }

    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, cred.user.uid))
    const extra = snap.exists() ? snap.data() : {}
    const mapped = mapFirebaseUser(cred.user, extra as Partial<AuthUser>)
    setUser(mapped)
    return mapped
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
    plan: Plan = 'starter',
    industryType: IndustryType | null = null,
  ) {
    // Demo mode — skip Firebase, inject mock user
    if (isDemoMode()) {
      const demoUser = { ...DEMO_USER, email, displayName, plan, industryType }
      setUser(demoUser)
      return { uid: demoUser.uid } as FirebaseUser
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })

    // Compute businessId here so the user doc is written with the correct value
    // immediately, eliminating the race between onAuthStateChanged and SignupPage
    const businessId = `biz_${cred.user.uid}`

    const userData: Omit<AuthUser, 'uid'> = {
      email,
      displayName,
      photoURL:         null,
      emailVerified:    false,
      role:             'business_owner',
      businessId,
      plan,
      industryType,
      stripeCustomerId: null,
      createdAt:        new Date(),
    }

    // Set user in store immediately with the correct businessId
    setUser({ uid: cred.user.uid, ...userData })

    // Write to Firestore — await so onAuthStateChanged reads the correct businessId
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
    }).catch(err => console.warn('Firestore user doc write failed:', err))

    return cred.user
  }

  async function signOut() {
    if (!isDemoMode()) await fbSignOut(auth)
    clearUser()
  }

  async function resetPassword(email: string) {
    if (isDemoMode()) return // no-op in demo
    await sendPasswordResetEmail(auth, email)
  }

  return { user, isLoading, login, register, signOut, resetPassword }
}
