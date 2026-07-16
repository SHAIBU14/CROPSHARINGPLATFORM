'use client'

import { User, Mail, MapPin, Calendar, Award } from 'lucide-react'

interface ProfileDropdownProps {
  isOpen: boolean
  onClose: () => void
  user: {
    firstName?: string
    lastName?: string
    username?: string
    email?: string
    location?: {
      city?: string
      state?: string
    }
    gardenExperience?: string
    isVerified?: boolean
    createdAt?: string
  } | null
}

export default function ProfileDropdown({ isOpen, onClose, user }: ProfileDropdownProps) {
  if (!isOpen) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-lg border z-50">
      {/* Header with user info */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-primary-green rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-sm text-gray-500">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* User details */}
      <div className="p-4 space-y-3">
        <div className="flex items-start space-x-3">
          <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Location</p>
            <p className="text-sm text-gray-900">
              {user?.location?.city && user?.location?.state
                ? `${user.location.city}, ${user.location.state}`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Award className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Experience</p>
            <p className="text-sm text-gray-900 capitalize">
              {user?.gardenExperience || 'beginner'}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="text-sm text-gray-900">{formatDate(user?.createdAt)}</p>
          </div>
        </div>

        {user?.isVerified && (
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
            <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-sm text-green-700 font-medium">Verified Member</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
          View Full Profile
        </button>
      </div>
    </div>
  )
}
