import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { COLLECTIONS } from '../config/constants'

// ─────────────────────────────────────────────────────────────
//  AuthContext
//  Provides: currentUser, userProfile, role, loading, login, logout
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null)
  const [userProfile,  setUserProfile]  = useState(null) // Full Firestore /users/{uid} doc
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  // Login with email + password
  async function login(email, password) {
    setError(null)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      // userProfile will be fetched by onAuthStateChanged listener
      return credential.user
    } catch (err) {
      const message = getAuthErrorMessage(err.code)
      setError(message)
      throw new Error(message)
    }
  }

  // Logout
  async function logout() {
    setUserProfile(null)
    await signOut(auth)
  }

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        try {
          // Fetch user profile from Firestore
          const userRef  = doc(db, COLLECTIONS.USERS, user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            setUserProfile({ id: userSnap.id, ...userSnap.data() })
          } else {
            // User exists in Auth but not in Firestore — edge case
            console.warn('User authenticated but no Firestore profile found.')
            setUserProfile(null)
          }
        } catch (err) {
          console.error('Error fetching user profile:', err)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    role:        userProfile?.role ?? null,
    roId:        userProfile?.roId ?? null,
    roName:      userProfile?.roName ?? null,
    permissions: userProfile?.permissions ?? {},
    loading,
    error,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

// Map Firebase error codes to friendly messages
function getAuthErrorMessage(code) {
  const messages = {
    'auth/invalid-email':          'Invalid email address.',
    'auth/user-disabled':          'This account has been disabled.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  }
  return messages[code] ?? 'Login failed. Please try again.'
}
