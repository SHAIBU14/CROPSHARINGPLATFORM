'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import DashboardStats from '@/components/DashboardStats'
import { 
  TreePine, 
  Crop, 
  Users, 
  MessageCircle, 
  TrendingUp,
  MapPin,
  Calendar,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalGardens: number
  totalCrops: number
  totalUsers: number
  totalMessages: number
  recentGardens: any[]
  recentCrops: any[]
  upcomingEvents: any[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, you'd have a dedicated dashboard endpoint
        // For now, we'll simulate the data
        setStats({
          totalGardens: 12,
          totalCrops: 45,
          totalUsers: 156,
          totalMessages: 23,
          recentGardens: [],
          recentCrops: [],
          upcomingEvents: []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-green to-secondary-green rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName}! 🌱
          </h1>
          <p className="text-green-100">
            Ready to grow and share with your community today?
          </p>
        </div>

        {/* Stats Grid with Real-time Updates */}
        <DashboardStats />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                href="/crops/create" 
                className="group w-full btn-primary text-left flex items-center justify-between hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <Crop className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Add New Crop Listing</span>
                </div>
                <div className="text-sm opacity-75 group-hover:opacity-100 transition-opacity">
                  Share your harvest →
                </div>
              </Link>
              
              <Link 
                href="/gardens/create" 
                className="group w-full btn-secondary text-left flex items-center justify-between hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <TreePine className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Create Garden Profile</span>
                </div>
                <div className="text-sm opacity-75 group-hover:opacity-100 transition-opacity">
                  Showcase your space →
                </div>
              </Link>
              
              <Link 
                href="/feed" 
                className="group w-full btn-outline text-left flex items-center justify-between hover:shadow-lg transition-all duration-300 border-primary-green hover:bg-primary-green hover:text-white"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Share Garden Update</span>
                </div>
                <div className="text-sm opacity-75 group-hover:opacity-100 transition-opacity">
                  Connect with community →
                </div>
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-primary-green rounded-lg mr-3">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Your garden was rated 5 stars!</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-secondary-green rounded-lg mr-3">
                  <Crop className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New crop request received</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-accent-green rounded-lg mr-3">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New message from Sarah</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Highlights */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/crops?category=vegetable&trending=true"
              className="group p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary-green mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-gray-900 group-hover:text-primary-green transition-colors">Trending</span>
              </div>
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                Tomatoes are the most requested crop this week
              </p>
              <div className="mt-2 text-xs text-primary-green font-medium group-hover:text-green-700 transition-colors">
                View trending crops →
              </div>
            </Link>
            
            <Link 
              href="/map?radius=2"
              className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Nearby</span>
              </div>
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                5 gardens within 2 miles of your location
              </p>
              <div className="mt-2 text-xs text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                Explore nearby gardens →
              </div>
            </Link>
            
            <Link 
              href="/feed?type=events"
              className="group p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-yellow-600 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-gray-900 group-hover:text-yellow-600 transition-colors">Events</span>
              </div>
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                Community seed swap this Saturday
              </p>
              <div className="mt-2 text-xs text-yellow-600 font-medium group-hover:text-yellow-700 transition-colors">
                View all events →
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
