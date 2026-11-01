'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Sprout, 
  ShieldCheck, 
  Edit3, 
  LogOut, 
  CheckCircle2, 
  Database, 
  AtSign, 
  Camera, 
  Save, 
  X, 
  RefreshCw, 
  Award,
  Sparkles,
  Info,
  Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { isSupabaseConfigured, fetchSupabaseProfile, upsertSupabaseProfile } from '@/lib/supabase'
import { auth } from '@/lib/firebase'

export default function ProfilePage() {
  const { user, logout, updateProfile, reloadProfile, loading: authLoading } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [supabaseConnected, setSupabaseConnected] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    location: '',
    bio: '',
    gardenExperience: 'beginner',
    profileImage: '',
  })

  // Format location string from object or string
  const formatLocation = (loc: any): string => {
    if (!loc) return ''
    if (typeof loc === 'string') return loc
    if (typeof loc === 'object') {
      const parts = [loc.city, loc.state].filter(Boolean)
      if (parts.length > 0) return parts.join(', ')
      if (loc.address) return loc.address
    }
    return ''
  }

  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not available'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Not available'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'Not available'
    }
  }

  // Populate form with current logged in user details
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
        location: formatLocation(user.location),
        bio: user.bio || '',
        gardenExperience: (user.gardenExperience as string) || 'beginner',
        profileImage: user.profileImage || '',
      })
      setImageError(false)
    }
  }, [user])

  // Check Supabase status and fetch additional profile data if available
  useEffect(() => {
    const checkSupabase = async () => {
      const configured = isSupabaseConfigured()
      setSupabaseConnected(configured)

      if (configured && user) {
        const uid = user.firebaseUid || auth?.currentUser?.uid
        if (uid) {
          try {
            const sbData = await fetchSupabaseProfile(uid, user.email)
            if (sbData) {
              setSupabaseConnected(true)
            }
          } catch (err) {
            console.warn('Supabase check error:', err)
          }
        }
      }
    }
    checkSupabase()
  }, [user])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await reloadProfile()
      toast.success('Profile refreshed with latest data')
    } catch (err) {
      toast.error('Could not refresh profile')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim()) {
      toast.error('First name is required')
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        gardenExperience: formData.gardenExperience as any,
        profileImage: formData.profileImage.trim(),
      })

      // Also upsert to Supabase if configured using the authenticated Firebase UID
      const firebaseUid = user?.firebaseUid || auth?.currentUser?.uid
      if (firebaseUid && isSupabaseConfigured()) {
        try {
          await upsertSupabaseProfile({
            firebaseUid,
            email: user?.email,
            username: formData.username.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            location: formData.location.trim(),
            bio: formData.bio.trim(),
            gardenExperience: formData.gardenExperience,
            profileImage: formData.profileImage.trim(),
          })
          setSupabaseConnected(true)
        } catch (sbErr) {
          console.warn('Supabase upsert warning on save:', sbErr)
        }
      }

      setIsEditing(false)
    } catch (error) {
      // Error handled in updateProfile
    } finally {
      setIsSaving(false)
    }
  }

  // Get user initials for avatar fallback
  const getInitials = (): string => {
    const first = user?.firstName?.[0] || ''
    const last = user?.lastName?.[0] || ''
    if (first || last) return `${first}${last}`.toUpperCase()
    return user?.username?.[0]?.toUpperCase() || 'U'
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Community Member'
  const registrationDate = user?.createdAt || auth?.currentUser?.metadata?.creationTime
  const firebaseUid = user?.firebaseUid || auth?.currentUser?.uid || user?._id || 'Not assigned'

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <span>Community Garden</span>
              <span>/</span>
              <span className="text-primary-green font-medium">User Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              My Profile
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your personal information, garden experience, and account details.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh profile data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary inline-flex items-center shadow-sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm"
              title="Sign out of your account"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Hero Profile Banner */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Decorative Cover Gradient */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute right-4 bottom-4 flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white">
              <Sparkles className="h-3.5 w-3.5" />
              <span>GardenShare Member</span>
            </div>
          </div>

          {/* User Info Header */}
          <div className="px-6 pb-6 pt-0 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 gap-4 sm:gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white">
                  {user?.profileImage && !imageError ? (
                    <img
                      src={user.profileImage}
                      alt={fullName}
                      onError={() => setImageError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold tracking-wider">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-1 right-1 p-2 bg-primary-green hover:bg-primary-green-dark text-white rounded-full shadow-md transition-colors"
                  title="Change profile image"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Name and Badges */}
              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {fullName}
                  </h2>
                  {user?.isVerified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 self-center sm:self-auto">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />
                      Verified
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 font-medium">
                  @{user?.username || 'gardener'}
                </p>

                {/* Tags / Pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sprout className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                    <span className="capitalize">{user?.gardenExperience || 'beginner'} Gardener</span>
                  </span>

                  {user?.location && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                      {formatLocation(user.location)}
                    </span>
                  )}

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1 text-blue-600" />
                    Firebase Auth
                  </span>
                </div>
              </div>

              {/* Quick Actions for Desktop */}
              <div className="flex items-center gap-2 pt-4 sm:pt-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Account Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registered Account Information */}
            <div className="card">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary-green" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Account Information
                  </h3>
                </div>
                <span className="text-xs text-gray-500">
                  Logged in as currently active user
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/70">
                  <div className="p-2 rounded-lg bg-white border border-gray-200 text-primary-green mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                      {fullName}
                    </p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/70">
                  <div className="p-2 rounded-lg bg-white border border-gray-200 text-primary-green mt-0.5">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                      {user?.email || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Username */}
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/70">
                  <div className="p-2 rounded-lg bg-white border border-gray-200 text-primary-green mt-0.5">
                    <AtSign className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                      @{user?.username || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/70">
                  <div className="p-2 rounded-lg bg-white border border-gray-200 text-primary-green mt-0.5">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </p>
                    {user?.phoneNumber ? (
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {user.phoneNumber}
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-sm text-gray-400 italic">Not available</span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-primary-green hover:underline font-medium"
                        >
                          + Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Registration Date */}
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/70">
                  <div className="p-2 rounded-lg bg-white border border-gray-200 text-primary-green mt-0.5">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {formatDate(registrationDate)}
                    </p>
                  </div>
                </div>

                {/* User Location */}
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/70">
                  <div className="p-2 rounded-lg bg-white border border-gray-200 text-primary-green mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Location
                    </p>
                    {formatLocation(user?.location) ? (
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {formatLocation(user?.location)}
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-sm text-gray-400 italic">Not available</span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-primary-green hover:underline font-medium"
                        >
                          + Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Gardening Journey Card */}
            <div className="card">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center space-x-2">
                  <Sprout className="h-5 w-5 text-primary-green" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gardening Profile & Bio
                  </h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 capitalize">
                  <Award className="h-3.5 w-3.5 mr-1" />
                  {user?.gardenExperience || 'beginner'}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  About Me / Bio
                </p>
                {user?.bio ? (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                    {user.bio}
                  </p>
                ) : (
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 italic">
                      No bio added yet. Tell the gardening community about your favourite crops, skills, or garden spaces!
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-2 text-xs font-medium text-primary-green hover:underline inline-flex items-center"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Write a bio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Backend Integration & Security Info (1 Col) */}
          <div className="space-y-6">
            {/* Backend Integration Status Card */}
            <div className="card">
              <div className="flex items-center space-x-2 pb-4 border-b border-gray-100 mb-4">
                <Database className="h-5 w-5 text-primary-green" />
                <h3 className="text-base font-semibold text-gray-900">
                  Backend Integration
                </h3>
              </div>

              <div className="space-y-4">
                {/* Firebase Authentication Status */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                      Firebase Authentication
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Secure identity verification & session management.
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 block truncate" title={firebaseUid}>
                      UID: {firebaseUid}
                    </span>
                  </div>
                </div>

                {/* Supabase SQL Database Status */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center">
                      <Database className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                      Supabase SQL Database
                    </span>
                    {supabaseConnected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-700">
                        Standby
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {supabaseConnected
                      ? 'Profiles table synced using Firebase UID.'
                      : 'Configured to query Supabase profiles via Firebase UID.'}
                  </p>
                  <div className="text-[11px] text-gray-500 pt-0.5">
                    Target Table: <code className="bg-white px-1 py-0.5 rounded border text-emerald-700">public.profiles</code>
                  </div>
                </div>

                {/* Password Security Notice */}
                <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start space-x-2.5">
                  <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <p className="font-semibold">Security & Privacy</p>
                    <p className="text-amber-700 mt-0.5">
                      Your password is encrypted and never stored or displayed on the profile page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card space-y-3">
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100">
                Account Actions
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full btn-outline flex items-center justify-center text-sm py-2"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile Information
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center text-sm font-medium py-2 px-4 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors duration-200 border border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-primary-green text-white">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                    <p className="text-xs text-gray-500">Update your account information</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>

                {/* Username & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. jgardener"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="input-field text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      title="Email is linked to your authentication account and cannot be modified here."
                    />
                  </div>
                </div>

                {/* Phone Number & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. +1 555-0199"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      User Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input-field text-sm"
                      placeholder="e.g. Seattle, WA"
                    />
                  </div>
                </div>

                {/* Garden Experience */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Garden Experience Level
                  </label>
                  <select
                    value={formData.gardenExperience}
                    onChange={(e) => setFormData({ ...formData, gardenExperience: e.target.value })}
                    className="input-field text-sm capitalize"
                  >
                    <option value="beginner">Beginner (Starting my gardening journey)</option>
                    <option value="intermediate">Intermediate (Growing regularly)</option>
                    <option value="advanced">Advanced (Experienced grower & harvester)</option>
                    <option value="expert">Expert (Master gardener & mentor)</option>
                  </select>
                </div>

                {/* Profile Picture URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={formData.profileImage}
                    onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                    className="input-field text-sm"
                    placeholder="https://example.com/photo.jpg"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Paste an image URL for your profile picture avatar.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bio / About Me
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="input-field text-sm resize-none"
                    placeholder="Tell the community about what you love growing, your garden plot, or favorite crops..."
                  />
                  <p className="text-right text-[11px] text-gray-400 mt-0.5">
                    {formData.bio.length}/500
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary inline-flex items-center text-sm disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

