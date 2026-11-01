'use client'

import React, { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { 
  searchActualCropSellers, 
  fetchMessagesFromSupabase, 
  sendMessageToSupabase, 
  fetchConversationsFromSupabase,
  SellerProfile,
  SupabaseMessage
} from '@/lib/supabase'
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  User,
  Sprout,
  X,
  MessageSquare,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Conversation {
  _id: string
  user: {
    _id: string
    id?: string
    firebaseUid?: string
    username: string
    firstName: string
    lastName: string
    fullName?: string
    profileImage?: string
    crops?: string[]
  }
  lastMessage: {
    content: string
    createdAt: string
    isRead: boolean
  }
  unreadCount: number
}

export default function MessagesPage() {
  const { user } = useAuth()

  // Real user identification via Firebase Auth / AuthContext
  const currentUserId = user?.firebaseUid || auth?.currentUser?.uid || user?._id || 'guest_user'
  const currentUserName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Me'
  const currentUserAvatar = user?.profileImage || auth?.currentUser?.photoURL || ''

  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null)
  const [messages, setMessages] = useState<SupabaseMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Seller Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SellerProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [availableSellers, setAvailableSellers] = useState<SellerProfile[]>([])

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load conversations and available crop sellers on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        // 1. Fetch real conversations from Supabase / storage
        const convList = await fetchConversationsFromSupabase(currentUserId)
        setConversations(convList)

        // 2. Fetch actual crop sellers from Supabase & crops database
        const sellers = await searchActualCropSellers('', currentUserId)
        setAvailableSellers(sellers)

        // If there's an existing conversation, open the first one by default
        if (convList.length > 0) {
          const first = convList[0]
          const partnerSeller: SellerProfile = {
            _id: first.user._id,
            id: first.user._id,
            username: first.user.username,
            firstName: first.user.firstName,
            lastName: first.user.lastName,
            fullName: `${first.user.firstName} ${first.user.lastName}`.trim() || first.user.username,
            profileImage: first.user.profileImage,
          }
          setSelectedSeller(partnerSeller)
        } else if (sellers.length > 0) {
          // Pre-select the first real crop seller so user has an active chat window
          setSelectedSeller(sellers[0])
        }
      } catch (error) {
        console.error('Error loading messages initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentUserId) {
      loadInitialData()
    }
  }, [currentUserId])

  // Handle dynamic seller search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const results = await searchActualCropSellers(searchQuery, currentUserId)
        setSearchResults(results)
      } catch (err) {
        console.warn('Error during seller search:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(() => {
      performSearch()
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, currentUserId])

  // Fetch messages when selected seller changes
  useEffect(() => {
    if (!selectedSeller) return

    const partnerId = selectedSeller._id || selectedSeller.id || selectedSeller.firebaseUid
    if (!partnerId) return

    const loadMessages = async () => {
      try {
        const history = await fetchMessagesFromSupabase(currentUserId, partnerId)
        setMessages(history)
      } catch (err) {
        console.error('Error loading messages for seller:', err)
      }
    }

    loadMessages()

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedSeller, currentUserId])

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Open chat with clicked seller
  const handleSelectSeller = (seller: SellerProfile) => {
    setSelectedSeller(seller)
    setSearchQuery('')
    setSearchResults([])

    // Check if conversation already exists in conversations list
    const partnerId = seller._id || seller.id || seller.firebaseUid
    const existing = conversations.find((c) => c.user._id === partnerId)
    if (!existing) {
      // Add temporary conversation row so it shows in the list
      const newConv: Conversation = {
        _id: String(partnerId),
        user: {
          _id: String(partnerId),
          username: seller.username,
          firstName: seller.firstName,
          lastName: seller.lastName,
          fullName: seller.fullName,
          profileImage: seller.profileImage,
          crops: seller.crops,
        },
        lastMessage: {
          content: 'Started new conversation',
          createdAt: new Date().toISOString(),
          isRead: true,
        },
        unreadCount: 0,
      }
      setConversations((prev) => [newConv, ...prev.filter((c) => c.user._id !== partnerId)])
    }
  }

  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSeller) return

    const partnerId = selectedSeller._id || selectedSeller.id || selectedSeller.firebaseUid
    if (!partnerId) return

    const textToSend = newMessage.trim()
    setNewMessage('')

    try {
      // Save message in Supabase & local storage
      const sentMsg = await sendMessageToSupabase({
        senderId: currentUserId,
        receiverId: String(partnerId),
        senderName: currentUserName,
        receiverName: selectedSeller.fullName || selectedSeller.username,
        senderAvatar: currentUserAvatar,
        receiverAvatar: selectedSeller.profileImage || '',
        content: textToSend,
      })

      // Add to messages list
      setMessages((prev) => [...prev, sentMsg])

      // Update conversations list with latest message
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.user._id !== partnerId)
        const updatedItem: Conversation = {
          _id: String(partnerId),
          user: {
            _id: String(partnerId),
            username: selectedSeller.username,
            firstName: selectedSeller.firstName,
            lastName: selectedSeller.lastName,
            fullName: selectedSeller.fullName,
            profileImage: selectedSeller.profileImage,
            crops: selectedSeller.crops,
          },
          lastMessage: {
            content: textToSend,
            createdAt: sentMsg.created_at,
            isRead: true,
          },
          unreadCount: 0,
        }
        return [updatedItem, ...filtered]
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Could not send message')
    }
  }

  // Get user initials for avatar
  const getInitials = (name?: string, username?: string): string => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      if (parts[0]) return parts[0][0].toUpperCase()
    }
    return (username?.[0] || 'S').toUpperCase()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="card">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 border-b border-gray-100">
                    <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="card h-96"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const selectedPartnerId = selectedSeller ? (selectedSeller._id || selectedSeller.id || selectedSeller.firebaseUid) : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Connect with your gardening community & crop sellers</p>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[640px]">
          {/* Left Column: Seller Search & Conversations List */}
          <div className="lg:col-span-1 h-full">
            <div className="card h-full flex flex-col p-4">
              {/* Dynamic Seller Search Box */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search sellers by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 pr-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Conversations or Search Results Container */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {/* 1. When actively searching: Display matching sellers from Supabase */}
                {searchQuery.trim().length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between px-2 py-1 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span>Matching Crop Sellers</span>
                      <span>{searchResults.length} found</span>
                    </div>

                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary-green border-t-transparent mr-2"></div>
                        Searching Supabase sellers...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((seller) => {
                        const isSelected = selectedPartnerId === (seller._id || seller.id)
                        return (
                          <div
                            key={seller._id || seller.id}
                            onClick={() => handleSelectSeller(seller)}
                            className={`p-3 rounded-xl cursor-pointer transition-colors border mb-1.5 ${
                              isSelected
                                ? 'bg-primary-green text-white border-primary-green shadow-sm'
                                : 'bg-white hover:bg-green-50/60 border-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {/* Profile Picture */}
                              <div className="relative flex-shrink-0">
                                {seller.profileImage ? (
                                  <img
                                    src={seller.profileImage}
                                    alt={seller.fullName}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                  />
                                ) : (
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                  }`}>
                                    {getInitials(seller.fullName, seller.username)}
                                  </div>
                                )}
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 ring-2 ring-white rounded-full"></span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {seller.fullName}
                                  </h4>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800'
                                  }`}>
                                    Seller
                                  </span>
                                </div>
                                <p className={`text-xs truncate ${
                                  isSelected ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  @{seller.username}
                                </p>
                                {seller.crops && seller.crops.length > 0 && (
                                  <p className={`text-[11px] truncate mt-0.5 flex items-center ${
                                    isSelected ? 'text-green-100' : 'text-emerald-700'
                                  }`}>
                                    <ShoppingBag className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span>Crops: {seller.crops.slice(0, 2).join(', ')}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                        <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">No matching crop sellers</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Try searching by first name, last name, or seller username.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. When not searching: Display conversations list */
                  <div>
                    {conversations.length > 0 ? (
                      conversations.map((conversation) => {
                        const isSelected = selectedPartnerId === conversation.user._id
                        const partnerName = `${conversation.user.firstName || ''} ${conversation.user.lastName || ''}`.trim() || conversation.user.username

                        return (
                          <div
                            key={conversation._id}
                            onClick={() => {
                              const sellerObj: SellerProfile = {
                                _id: conversation.user._id,
                                id: conversation.user._id,
                                username: conversation.user.username,
                                firstName: conversation.user.firstName,
                                lastName: conversation.user.lastName,
                                fullName: partnerName,
                                profileImage: conversation.user.profileImage,
                                crops: conversation.user.crops,
                              }
                              setSelectedSeller(sellerObj)
                            }}
                            className={`p-3 rounded-xl cursor-pointer transition-colors mb-1.5 ${
                              isSelected
                                ? 'bg-primary-green text-white shadow-sm'
                                : 'hover:bg-gray-50 bg-white border border-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {/* Profile Picture */}
                              <div className="relative flex-shrink-0">
                                {conversation.user.profileImage ? (
                                  <img
                                    src={conversation.user.profileImage}
                                    alt={partnerName}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                  />
                                ) : (
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                  }`}>
                                    {getInitials(partnerName, conversation.user.username)}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className={`font-semibold text-sm truncate ${
                                    isSelected ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {partnerName}
                                  </h3>
                                  {conversation.unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs truncate mt-0.5 ${
                                  isSelected ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {conversation.lastMessage.content}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${
                                  isSelected ? 'text-green-200' : 'text-gray-400'
                                }`}>
                                  {new Date(conversation.lastMessage.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      /* If user has no active chats yet, show active crop sellers to start with */
                      <div className="space-y-3">
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Active Crop Sellers</span>
                          <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                            Ready to Chat
                          </span>
                        </div>

                        {availableSellers.map((seller) => {
                          const isSelected = selectedPartnerId === (seller._id || seller.id)
                          return (
                            <div
                              key={seller._id || seller.id}
                              onClick={() => handleSelectSeller(seller)}
                              className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                                isSelected
                                  ? 'bg-primary-green text-white border-primary-green shadow-sm'
                                  : 'bg-white hover:bg-green-50/50 border-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                {seller.profileImage ? (
                                  <img
                                    src={seller.profileImage}
                                    alt={seller.fullName}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                                  />
                                ) : (
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                  }`}>
                                    {getInitials(seller.fullName, seller.username)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {seller.fullName}
                                  </h4>
                                  <p className={`text-xs truncate ${
                                    isSelected ? 'text-green-100' : 'text-gray-500'
                                  }`}>
                                    @{seller.username}
                                  </p>
                                  {seller.crops && seller.crops.length > 0 && (
                                    <p className={`text-[11px] truncate mt-0.5 ${
                                      isSelected ? 'text-green-100' : 'text-emerald-700'
                                    }`}>
                                      Sells: {seller.crops.slice(0, 2).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="lg:col-span-2 h-full">
            <div className="card h-full flex flex-col p-0 overflow-hidden">
              {selectedSeller ? (
                <>
                  {/* Messages Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                      {selectedSeller.profileImage ? (
                        <img
                          src={selectedSeller.profileImage}
                          alt={selectedSeller.fullName}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-green-100 shadow-sm"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-primary-green rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {getInitials(selectedSeller.fullName, selectedSeller.username)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {selectedSeller.fullName}
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                            <Sprout className="h-3 w-3 mr-1" />
                            Crop Seller
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          @{selectedSeller.username} • Available on GardenShare
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <button className="p-2 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages List Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-primary-green flex items-center justify-center mb-3">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm">
                          Start chatting with {selectedSeller.fullName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                          Ask about available crops, harvest schedules, prices, or coordinate a pickup.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMe = message.sender_id === currentUserId || message.senderId === currentUserId

                        return (
                          <div
                            key={message.id || message._id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm ${
                              isMe
                                ? 'bg-primary-green text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                                isMe ? 'text-green-100' : 'text-gray-400'
                              }`}>
                                <span>
                                  {new Date(message.created_at || message.createdAt || Date.now()).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && (
                                  <span>
                                    {message.is_read || message.isRead ? (
                                      <CheckCheck className="h-3.5 w-3.5" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Bar */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="flex items-center space-x-2"
                    >
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Add attachment"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>

                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder={`Message ${selectedSeller.firstName || selectedSeller.fullName}...`}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="input-field pr-10 text-sm py-2.5"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Insert emoji"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="btn-primary p-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-lg"
                        title="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center max-w-sm">
                    <div className="text-5xl mb-3">💬</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Select a Crop Seller
                    </h3>
                    <p className="text-sm text-gray-500">
                      Type a seller's name or username in the search box on the left to start a conversation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
