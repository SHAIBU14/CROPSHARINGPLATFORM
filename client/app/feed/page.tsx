'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Plus, 
  Image as ImageIcon, 
  MapPin, 
  Calendar, 
  Heart, 
  MessageCircle, 
  Share2,
  Leaf,
  TreePine,
  Crop
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface FeedPost {
  _id: string
  type: 'garden-update' | 'crop-share' | 'event' | 'tip'
  title: string
  content: string
  images: Array<{
    url: string
    caption: string
  }>
  author: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  garden?: {
    _id: string
    name: string
    location: {
      city: string
      state: string
    }
  }
  likes: number
  comments: number
  createdAt: string
  tags: string[]
}

export default function FeedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPost, setNewPost] = useState({
    type: 'garden-update',
    title: '',
    content: '',
    images: [] as Array<{ url: string; caption: string }>,
    tags: [] as string[]
  })

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Mock feed posts
        const mockPosts: FeedPost[] = [
          {
            _id: '1',
            type: 'garden-update',
            title: 'Spring Planting Season Begins!',
            content: 'Just finished planting our first batch of tomatoes and peppers. The raised beds are looking great this year!',
            images: [
              { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', caption: 'Raised garden beds' },
              { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', caption: 'Tomato seedlings' }
            ],
            author: {
              _id: '1',
              username: 'gardener_jane',
              firstName: 'Jane',
              lastName: 'Smith',
              profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
            },
            garden: {
              _id: '1',
              name: 'Downtown Community Garden',
              location: { city: 'San Francisco', state: 'CA' }
            },
            likes: 12,
            comments: 5,
            createdAt: '2024-01-16T10:30:00Z',
            tags: ['spring', 'planting', 'tomatoes']
          },
          {
            _id: '2',
            type: 'crop-share',
            title: 'Fresh Basil Available!',
            content: 'Harvested a bumper crop of sweet basil today. Perfect for pesto or Italian cooking. Free to anyone who wants some!',
            images: [
              { url: 'https://images.unsplash.com/photo-1615485925534-5986c36946e0?w=400&h=300&fit=crop', caption: 'Fresh basil harvest' }
            ],
            author: {
              _id: '2',
              username: 'herb_master',
              firstName: 'Maria',
              lastName: 'Rodriguez',
              profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
            },
            garden: {
              _id: '3',
              name: 'Herb Haven Garden',
              location: { city: 'Berkeley', state: 'CA' }
            },
            likes: 8,
            comments: 3,
            createdAt: '2024-01-16T08:15:00Z',
            tags: ['basil', 'herbs', 'free']
          },
          {
            _id: '3',
            type: 'event',
            title: 'Community Seed Swap This Saturday',
            content: 'Join us for our monthly seed swap! Bring your extra seeds and take home something new to try. Coffee and snacks provided.',
            images: [],
            author: {
              _id: '3',
              username: 'community_organizer',
              firstName: 'Mike',
              lastName: 'Chen',
              profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
            },
            likes: 15,
            comments: 7,
            createdAt: '2024-01-15T16:20:00Z',
            tags: ['event', 'seeds', 'community']
          }
        ]
        
        setPosts(mockPosts)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching posts:', error)
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in both title and content')
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const post: FeedPost = {
        _id: Date.now().toString(),
        type: newPost.type as any,
        title: newPost.title,
        content: newPost.content,
        images: newPost.images,
        author: {
          _id: 'current-user',
          username: 'current_user',
          firstName: 'Current',
          lastName: 'User'
        },
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        tags: newPost.tags
      }
      
      setPosts(prev => [post, ...prev])
      setNewPost({
        type: 'garden-update',
        title: '',
        content: '',
        images: [],
        tags: []
      })
      setShowCreateForm(false)
      
      // Show success message
      alert('Post created successfully!')
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Error creating post. Please try again.')
    }
  }

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post._id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ))
  }

  const handleComment = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post._id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ))
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

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'garden-update':
        return <TreePine className="h-4 w-4 text-green-600" />
      case 'crop-share':
        return <Crop className="h-4 w-4 text-blue-600" />
      case 'event':
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'tip':
        return <Leaf className="h-4 w-4 text-yellow-600" />
      default:
        return <Leaf className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
            <p className="text-gray-600 mt-1">Share updates and connect with fellow gardeners</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 sm:mt-0 btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Share Update
          </button>
        </div>

        {/* Create Post Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Update</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Type
                </label>
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="garden-update">Garden Update</option>
                  <option value="crop-share">Crop Share</option>
                  <option value="event">Event</option>
                  <option value="tip">Gardening Tip</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="What's happening in your garden?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="Tell us more about your update..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.title || !newPost.content}
                  className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {post.author.profileImage ? (
                      <Image
                        src={post.author.profileImage}
                        alt={`${post.author.firstName} ${post.author.lastName}`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary-green rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {post.author.firstName[0]}{post.author.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {post.author.firstName} {post.author.lastName}
                      </h3>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                      <div className="flex items-center text-gray-500">
                        {getPostIcon(post.type)}
                      </div>
                    </div>
                    
                    {post.garden && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{post.garden.name}, {post.garden.location.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-gray-700 mb-4">{post.content}</p>
                
                {/* Post Images */}
                {post.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {post.images.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.caption}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                        {image.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                            {image.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => handleLike(post._id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post._id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                  </div>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                    <Share2 className="h-5 w-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share an update with the community!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Share Your First Update
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}