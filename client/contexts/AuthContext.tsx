'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { API_URL, getErrorMessage } from '@/lib/api'
import { auth, isFirebaseEnabled } from '@/lib/firebase'

interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  profileImage?: string
  location?: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  bio?: string
  gardenExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  isVerified: boolean
  isAdmin: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

interface RegisterData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  location?: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    axios.defaults.baseURL = API_URL.replace(/\/api\/?$/, '') + '/api'
    axios.defaults.timeout = 10000

    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await axios.get('/auth/me')
          setUser(response.data.user)
        } catch {
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      if (isFirebaseEnabled && auth) {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        const idToken = await credential.user.getIdToken()
        const response = await axios.post('/auth/firebase', {
          idToken,
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          photoURL: credential.user.photoURL
        })

        const { token, user: userData } = response.data
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(userData)

        toast.success('Login successful!')
        router.push('/dashboard')
        return
      }

      const response = await axios.post('/auth/login', {
        email,
        password
      })

      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)

      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Login failed')
      toast.error(message)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      let idToken = 'demo-token'
      let uid = `google-${Date.now()}`
      let email = 'demo.google@example.com'
      let displayName = 'Demo Google User'
      let photoURL = ''

      if (isFirebaseEnabled && auth) {
        try {
          const provider = new GoogleAuthProvider()
          const credential = await signInWithPopup(auth, provider)
          idToken = await credential.user.getIdToken()
          uid = credential.user.uid
          email = credential.user.email || email
          displayName = credential.user.displayName || displayName
          photoURL = credential.user.photoURL || photoURL
        } catch (firebaseError) {
          console.warn('Firebase popup failed, falling back to demo mode:', firebaseError)
          toast.success('Using Demo Google Account (Firebase auth failed)')
        }
      } else {
        toast.success('Using Demo Google Account (Firebase not configured)')
      }

      const response = await axios.post('/auth/firebase', {
        idToken,
        uid,
        email,
        displayName,
        photoURL
      })

      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)

      toast.success('Signed in with Google!')
      router.push('/dashboard')
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Google sign-in failed')
      toast.error(message)
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      if (isFirebaseEnabled && auth) {
        const credential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
        const idToken = await credential.user.getIdToken()
        const response = await axios.post('/auth/firebase', {
          idToken,
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: `${userData.firstName} ${userData.lastName}`.trim(),
          photoURL: credential.user.photoURL,
          profile: userData
        })

        const { token, user: userDataResponse } = response.data
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(userDataResponse)

        toast.success('Account created successfully!')
        router.push('/dashboard')
        return
      }

      await axios.post('/auth/register', userData)

      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)

      toast.success('Account created successfully!')
      router.push(`/auth/login?registered=1&email=${encodeURIComponent(userData.email)}`)
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Registration failed')
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    if (isFirebaseEnabled && auth) {
      await signOut(auth)
    }

    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null))
  }

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
