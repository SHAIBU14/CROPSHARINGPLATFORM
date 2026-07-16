'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  User
} from 'lucide-react'

interface Conversation {
  _id: string
  user: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  lastMessage: {
    content: string
    createdAt: string
    isRead: boolean
  }
  unreadCount: number
}

interface Message {
  _id: string
  sender: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  receiver: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  content: string
  createdAt: string
  isRead: boolean
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Simulate API call
        const mockConversations: Conversation[] = [
          {
            _id: '1',
            user: {
              _id: '2',
              username: 'farmer2',
              firstName: 'Mike',
              lastName: 'Chen'
            },
            lastMessage: {
              content: 'Thanks for the tomatoes! They were delicious.',
              createdAt: '2024-01-15T14:30:00Z',
              isRead: false
            },
            unreadCount: 2
          },
          {
            _id: '2',
            user: {
              _id: '3',
              username: 'organizer1',
              firstName: 'Lisa',
              lastName: 'Williams'
            },
            lastMessage: {
              content: 'See you at the seed swap this Saturday!',
              createdAt: '2024-01-14T16:45:00Z',
              isRead: true
            },
            unreadCount: 0
          },
          {
            _id: '3',
            user: {
              _id: '4',
              username: 'gardener3',
              firstName: 'David',
              lastName: 'Brown'
            },
            lastMessage: {
              content: 'Can I get some basil from your garden?',
              createdAt: '2024-01-13T09:20:00Z',
              isRead: true
            },
            unreadCount: 0
          }
        ]
        setConversations(mockConversations)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          // Simulate API call
          const mockMessages: Message[] = [
            {
              _id: '1',
              sender: {
                _id: '2',
                username: 'farmer2',
                firstName: 'Mike',
                lastName: 'Chen'
              },
              receiver: {
                _id: '1',
                username: 'gardener1',
                firstName: 'Sarah',
                lastName: 'Johnson'
              },
              content: 'Hi! I saw your tomato harvest post. Amazing work!',
              createdAt: '2024-01-15T10:00:00Z',
              isRead: true
            },
            {
              _id: '2',
              sender: {
                _id: '1',
                username: 'gardener1',
                firstName: 'Sarah',
                lastName: 'Johnson'
              },
              receiver: {
                _id: '2',
                username: 'farmer2',
                firstName: 'Mike',
                lastName: 'Chen'
              },
              content: 'Thank you! Would you like some tomatoes?',
              createdAt: '2024-01-15T10:15:00Z',
              isRead: true
            },
            {
              _id: '3',
              sender: {
                _id: '2',
                username: 'farmer2',
                firstName: 'Mike',
                lastName: 'Chen'
              },
              receiver: {
                _id: '1',
                username: 'gardener1',
                firstName: 'Sarah',
                lastName: 'Johnson'
              },
              content: 'That would be wonderful! I can trade some basil if you\'d like.',
              createdAt: '2024-01-15T10:30:00Z',
              isRead: true
            },
            {
              _id: '4',
              sender: {
                _id: '1',
                username: 'gardener1',
                firstName: 'Sarah',
                lastName: 'Johnson'
              },
              receiver: {
                _id: '2',
                username: 'farmer2',
                firstName: 'Mike',
                lastName: 'Chen'
              },
              content: 'Perfect! I\'ll bring them to the community garden tomorrow.',
              createdAt: '2024-01-15T14:00:00Z',
              isRead: true
            },
            {
              _id: '5',
              sender: {
                _id: '2',
                username: 'farmer2',
                firstName: 'Mike',
                lastName: 'Chen'
              },
              receiver: {
                _id: '1',
                username: 'gardener1',
                firstName: 'Sarah',
                lastName: 'Johnson'
              },
              content: 'Thanks for the tomatoes! They were delicious.',
              createdAt: '2024-01-15T14:30:00Z',
              isRead: false
            }
          ]
          setMessages(mockMessages)
        } catch (error) {
          console.error('Error fetching messages:', error)
        }
      }

      fetchMessages()
    }
  }, [selectedConversation])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Simulate sending message
      const newMsg: Message = {
        _id: Date.now().toString(),
        sender: {
          _id: '1',
          username: 'gardener1',
          firstName: 'Sarah',
          lastName: 'Johnson'
        },
        receiver: {
          _id: '2',
          username: 'farmer2',
          firstName: 'Mike',
          lastName: 'Chen'
        },
        content: newMessage,
        createdAt: new Date().toISOString(),
        isRead: false
      }
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="card">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 border-b">
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Connect with your gardening community</p>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="card h-full flex flex-col">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="input-field pl-10"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation._id
                        ? 'bg-primary-green text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-green rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-sm font-medium">
                          {conversation.user.firstName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium truncate ${
                            selectedConversation === conversation._id ? 'text-white' : 'text-gray-900'
                          }`}>
                            {conversation.user.firstName} {conversation.user.lastName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          selectedConversation === conversation._id ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {conversation.lastMessage.content}
                        </p>
                        <p className={`text-xs ${
                          selectedConversation === conversation._id ? 'text-green-200' : 'text-gray-400'
                        }`}>
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2">
            <div className="card h-full flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Messages Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-green rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-medium">
                          {conversations.find(c => c._id === selectedConversation)?.user.firstName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {conversations.find(c => c._id === selectedConversation)?.user.firstName}{' '}
                          {conversations.find(c => c._id === selectedConversation)?.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{conversations.find(c => c._id === selectedConversation)?.user.username}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === '1' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender._id === '1'
                            ? 'bg-primary-green text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 ${
                            message.sender._id === '1' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.sender._id === '1' && (
                              <span className="ml-1">
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="input-field pr-10"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        className="btn-primary"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
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
