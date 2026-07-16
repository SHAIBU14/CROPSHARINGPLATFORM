import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

const looksLikePlaceholder = (value: string) => !value || value.startsWith('your-') || value.startsWith('firebase')

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !looksLikePlaceholder(firebaseConfig.apiKey) &&
    !looksLikePlaceholder(firebaseConfig.authDomain) &&
    !looksLikePlaceholder(firebaseConfig.projectId) &&
    !looksLikePlaceholder(firebaseConfig.appId)
)

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null

if (hasFirebaseConfig) {
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  firebaseAuth = getAuth(firebaseApp)
}

export const auth = firebaseAuth
export const isFirebaseEnabled = Boolean(firebaseAuth)
