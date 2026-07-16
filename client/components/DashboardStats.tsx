'use client'

import { useState, useEffect } from 'react'
import { TreePine, Crop, Users, MessageCircle, TrendingUp, Activity } from 'lucide-react'

interface DashboardStats {
  gardens: number
  activeCrops: number
  communityMembers: number
  messages: number
  recentActivity: Array<{
    id: string
    type: 'rating' | 'crop-request' | 'visit' | 'message'
    message: string
    timeAgo: string
    icon: string
  }>
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    gardens: 12,
    activeCrops: 45,
    communityMembers: 156,
    messages: 23,
    recentActivity: [
      {
        id: '1',
        type: 'rating',
        message: 'Your garden was rated 5 stars!',
        timeAgo: '2 hours ago',
        icon: '⭐'
      },
      {
        id: '2',
        type: 'crop-request',
        message: 'New crop request received',
        timeAgo: '4 hours ago',
        icon: '🌱'
      }
    ]
  })

  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    // Simulate real-time data updates
    const interval = setInterval(() => {
      setStats(prevStats => ({
        ...prevStats,
        // Simulate small random changes to make it feel live
        gardens: prevStats.gardens + (Math.random() > 0.95 ? 1 : 0),
        activeCrops: prevStats.activeCrops + (Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0),
        communityMembers: prevStats.communityMembers + (Math.random() > 0.98 ? 1 : 0),
        messages: prevStats.messages + (Math.random() > 0.92 ? 1 : 0),
        recentActivity: [
          ...prevStats.recentActivity.slice(0, 1), // Keep only the latest
          {
            id: Date.now().toString(),
            type: 'visit',
            message: 'New garden visitor',
            timeAgo: 'Just now',
            icon: '👥'
          }
        ]
      }))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isLive])

  const statsCards = [
    {
      title: 'My Gardens',
      value: stats.gardens,
      icon: TreePine,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+2 this week'
    },
    {
      title: 'Active Crops',
      value: stats.activeCrops,
      icon: Crop,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+5 today'
    },
    {
      title: 'Community',
      value: stats.communityMembers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+12 this month'
    },
    {
      title: 'Messages',
      value: stats.messages,
      icon: MessageCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+3 unread'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Live Data Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isLive ? 'Live Data' : 'Data Paused'}
          </span>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Activity className="h-4 w-4" />
          <span>{isLive ? 'Pause' : 'Resume'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                <p className="text-xs text-green-600 mt-1">{card.change}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
            {isLive && (
              <div className="mt-3 flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Live updates</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {stats.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.timeAgo}</p>
              </div>
              {isLive && activity.timeAgo === 'Just now' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
