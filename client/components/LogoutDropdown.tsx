'use client'

import { LogOut } from 'lucide-react'

interface LogoutDropdownProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export default function LogoutDropdown({ isOpen, onClose, onLogout }: LogoutDropdownProps) {
  if (!isOpen) return null

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border z-50">
      <div className="p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
