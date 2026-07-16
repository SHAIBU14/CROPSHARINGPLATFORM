'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Heart, MessageCircle, Crop } from 'lucide-react'

interface Notification {
  _id: string
  type: 'crop-request' | 'garden-visit' | 'rating' | 'message' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: {
    cropId?: string
    gardenId?: string
    senderId?: string
  }
}

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Mock notifications for demo
        const mockNotifications: Notification[] = [
          {
            _id: '1',
            type: 'rating',
            title: 'New Garden Rating',
            message: 'Your garden "Sunny Side Community Garden" received a 5-star rating!',
            isRead: false,
            createdAt: '2024-01-16T10:30:00Z',
            data: { gardenId: '1' }
          },
          {
            _id: '2',
            type: 'crop-request',
            title: 'Crop Request Received',
            message: 'Sarah Johnson requested 2kg of your Cherry Tomatoes',
            isRead: false,
            createdAt: '2024-01-16T08:15:00Z',
            data: { cropId: '1', senderId: '2' }
          },
          {
            _id: '3',
            type: 'message',
            title: 'New Message',
            message: 'Mike Chen sent you a message about garden collaboration',
            isRead: true,
            createdAt: '2024-01-16T07:45:00Z',
            data: { senderId: '3' }
          },
          {
            _id: '4',
            type: 'garden-visit',
            title: 'Garden Visit',
            message: 'Emma Davis visited your "Green Thumb Urban Farm"',
            isRead: true,
            createdAt: '2024-01-15T16:20:00Z',
            data: { gardenId: '2' }
          },
          {
            _id: '5',
            type: 'system',
            title: 'Welcome to GardenShare!',
            message: 'Complete your profile to get the most out of your gardening community',
            isRead: true,
            createdAt: '2024-01-15T09:00:00Z'
          }
        ]
        
        setNotifications(mockNotifications)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'crop-request':
        return <Crop className="h-4 w-4 text-green-600" />
      case 'garden-visit':
        return <Heart className="h-4 w-4 text-blue-600" />
      case 'rating':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'message':
        return <MessageCircle className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all notifications
        </button>
      </div>
    </div>
  )
}
