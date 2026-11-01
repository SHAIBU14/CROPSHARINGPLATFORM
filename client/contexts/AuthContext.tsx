'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { API_URL, getErrorMessage } from '@/lib/api'
import { auth, isFirebaseEnabled } from '@/lib/firebase'
import { isSupabaseConfigured, fetchSupabaseProfile, upsertSupabaseProfile } from '@/lib/supabase'

export interface UserLocation {
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  profileImage?: string
  phoneNumber?: string
  location?: UserLocation | string
  bio?: string
  gardenExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | string
  isVerified: boolean
  isAdmin: boolean
  firebaseUid?: string
  createdAt?: string
  updatedAt?: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  location?: UserLocation | string
  bio?: string
  gardenExperience?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  updateProfile: (profileData: Partial<User>) => Promise<User>
  reloadProfile: () => Promise<void>
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
          let userData: User = response.data.user

          // If Supabase is configured, fetch additional user profile info using Firebase user ID
          const firebaseUid = userData.firebaseUid || auth?.currentUser?.uid
          if (firebaseUid && isSupabaseConfigured()) {
            try {
              const supabaseProfile = await fetchSupabaseProfile(firebaseUid, userData.email)
              if (supabaseProfile) {
                userData = {
                  ...userData,
                  phoneNumber: supabaseProfile.phoneNumber || userData.phoneNumber,
                  location: supabaseProfile.location || userData.location,
                  bio: supabaseProfile.bio || userData.bio,
                  profileImage: supabaseProfile.profileImage || userData.profileImage,
                  gardenExperience: supabaseProfile.gardenExperience || userData.gardenExperience,
                }
              }
            } catch (sbError) {
              console.warn('Could not fetch Supabase profile during auth check:', sbError)
            }
          }

          setUser(userData)
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

        let combinedUser: User = {
          ...userData,
          firebaseUid: credential.user.uid,
          phoneNumber: userData.phoneNumber || credential.user.phoneNumber || '',
          profileImage: userData.profileImage || credential.user.photoURL || '',
          createdAt: userData.createdAt || credential.user.metadata?.creationTime
        }

        // Fetch additional profile data from Supabase if configured
        if (isSupabaseConfigured()) {
          try {
            const sbProfile = await fetchSupabaseProfile(credential.user.uid, combinedUser.email)
            if (sbProfile) {
              combinedUser = {
                ...combinedUser,
                phoneNumber: sbProfile.phoneNumber || combinedUser.phoneNumber,
                location: sbProfile.location || combinedUser.location,
                bio: sbProfile.bio || combinedUser.bio,
                profileImage: sbProfile.profileImage || combinedUser.profileImage,
                gardenExperience: sbProfile.gardenExperience || combinedUser.gardenExperience,
              }
            }
          } catch (sbErr) {
            console.warn('Supabase fetch error on login:', sbErr)
          }
        }

        setUser(combinedUser)
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
      let creationTime: string | undefined

      if (isFirebaseEnabled && auth) {
        try {
          const provider = new GoogleAuthProvider()
          const credential = await signInWithPopup(auth, provider)
          idToken = await credential.user.getIdToken()
          uid = credential.user.uid
          email = credential.user.email || email
          displayName = credential.user.displayName || displayName
          photoURL = credential.user.photoURL || photoURL
          creationTime = credential.user.metadata?.creationTime
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

      let combinedUser: User = {
        ...userData,
        firebaseUid: uid,
        profileImage: photoURL || userData.profileImage,
        createdAt: userData.createdAt || creationTime
      }

      // Fetch additional profile data from Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const sbProfile = await fetchSupabaseProfile(uid, email)
          if (sbProfile) {
            combinedUser = {
              ...combinedUser,
              phoneNumber: sbProfile.phoneNumber || combinedUser.phoneNumber,
              location: sbProfile.location || combinedUser.location,
              bio: sbProfile.bio || combinedUser.bio,
              profileImage: sbProfile.profileImage || combinedUser.profileImage,
              gardenExperience: sbProfile.gardenExperience || combinedUser.gardenExperience,
            }
          }
        } catch (sbErr) {
          console.warn('Supabase fetch error on Google login:', sbErr)
        }
      }

      setUser(combinedUser)
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

        const combinedUser: User = {
          ...userDataResponse,
          firebaseUid: credential.user.uid,
          phoneNumber: userData.phoneNumber,
          location: userData.location,
          createdAt: credential.user.metadata?.creationTime || new Date().toISOString()
        }

        // If Supabase configured, create profile row in Supabase SQL DB
        if (isSupabaseConfigured()) {
          try {
            await upsertSupabaseProfile({
              firebaseUid: credential.user.uid,
              email: userData.email,
              username: userData.username,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phoneNumber: userData.phoneNumber,
              location: userData.location,
              bio: userData.bio,
              gardenExperience: userData.gardenExperience || 'beginner',
            })
          } catch (sbErr) {
            console.warn('Supabase profile creation error:', sbErr)
          }
        }

        setUser(combinedUser)
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
      try {
        await signOut(auth)
      } catch (err) {
        console.warn('Firebase signout warning:', err)
      }
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

  const updateProfile = async (profileData: Partial<User>): Promise<User> => {
    try {
      const response = await axios.put('/users/profile', profileData)
      let updatedUser: User = response.data.user || { ...(user as User), ...profileData }

      // Sync with Supabase SQL database using authenticated Firebase user ID
      const firebaseUid = updatedUser.firebaseUid || user?.firebaseUid || auth?.currentUser?.uid
      if (firebaseUid && isSupabaseConfigured()) {
        try {
          const sbResult = await upsertSupabaseProfile({
            firebaseUid,
            email: updatedUser.email,
            username: updatedUser.username,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phoneNumber: updatedUser.phoneNumber,
            location: updatedUser.location,
            bio: updatedUser.bio,
            gardenExperience: updatedUser.gardenExperience,
            profileImage: updatedUser.profileImage,
          })
          if (sbResult.data) {
            updatedUser = {
              ...updatedUser,
              phoneNumber: sbResult.data.phoneNumber || updatedUser.phoneNumber,
              location: sbResult.data.location || updatedUser.location,
            }
          }
        } catch (sbError) {
          console.warn('Supabase sync warning on profile update:', sbError)
        }
      }

      setUser(updatedUser)
      toast.success('Profile updated successfully!')
      return updatedUser
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to update profile')
      toast.error(message)
      throw error
    }
  }

  const reloadProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      let profileUser: User | null = null
      try {
        const response = await axios.get('/users/profile')
        profileUser = response.data.user
      } catch {
        const meRes = await axios.get('/auth/me')
        profileUser = meRes.data.user
      }

      if (profileUser) {
        const firebaseUid = profileUser.firebaseUid || user?.firebaseUid || auth?.currentUser?.uid
        if (firebaseUid && isSupabaseConfigured()) {
          try {
            const sbProfile = await fetchSupabaseProfile(firebaseUid, profileUser.email)
            if (sbProfile) {
              profileUser = {
                ...profileUser,
                phoneNumber: sbProfile.phoneNumber || profileUser.phoneNumber,
                location: sbProfile.location || profileUser.location,
                bio: sbProfile.bio || profileUser.bio,
                profileImage: sbProfile.profileImage || profileUser.profileImage,
                gardenExperience: sbProfile.gardenExperience || profileUser.gardenExperience,
              }
            }
          } catch (sbErr) {
            console.warn('Supabase profile fetch error on reload:', sbErr)
          }
        }
        setUser(profileUser)
      }
    } catch (err) {
      console.warn('Reload profile failed:', err)
    }
  }

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    updateProfile,
    reloadProfile,
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
