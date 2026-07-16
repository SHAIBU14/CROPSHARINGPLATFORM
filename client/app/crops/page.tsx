'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Search,
  Filter,
  Grid,
  List,
  Leaf,
  Gift,
  TreePine,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface Crop {
  _id: string
  name: string
  variety?: string
  description?: string
  category: string
  quantity: {
    amount: number
    unit: string
  }
  availability: string
  harvestDate: string
  price: number
  isFree: boolean
  images: Array<{
    url: string
    caption: string
  }>
  garden: {
    _id: string
    name: string
    location: {
      city: string
      state: string
      coordinates: {
        lat: number
        lng: number
      }
    }
  }
  owner: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  createdAt: string
}

// Mock data moved outside component to avoid recreation on every render
const MOCK_CROPS: Crop[] = [
  {
    _id: '1',
    name: 'Cherry Tomatoes',
    variety: 'Organic',
    description: 'Sweet, juicy cherry tomatoes grown organically in my backyard garden. Perfect for salads, snacking, or cooking.',
    category: 'vegetable',
    quantity: { amount: 15, unit: 'kg' },
    availability: 'available',
    harvestDate: '2024-01-15T00:00:00Z',
    price: 0,
    isFree: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop', caption: 'Fresh cherry tomatoes' }
    ],
    garden: {
      _id: '1',
      name: 'Downtown Community Garden',
      location: {
        city: 'San Francisco',
        state: 'CA',
        coordinates: { lat: 37.7749, lng: -122.4194 }
      }
    },
    owner: {
      _id: '1',
      username: 'gardener_jane',
      firstName: 'Jane',
      lastName: 'Smith',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    createdAt: '2024-01-10T00:00:00Z'
  },
  // ... (include other mock crops from your original code, but remove duplicate images)
  {
    _id: '2',
    name: 'Romaine Lettuce',
    variety: 'Fresh',
    description: 'Crisp, fresh romaine lettuce heads. Great for Caesar salads and wraps. Harvested this morning!',
    category: 'vegetable',
    quantity: { amount: 8, unit: 'heads' },
    availability: 'available',
    harvestDate: '2024-01-12T00:00:00Z',
    price: 0,
    isFree: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop', caption: 'Fresh romaine lettuce' }
    ],
    garden: {
      _id: '2',
      name: 'Riverside Garden',
      location: {
        city: 'Oakland',
        state: 'CA',
        coordinates: { lat: 37.8044, lng: -122.2712 }
      }
    },
    owner: {
      _id: '2',
      username: 'green_thumb',
      firstName: 'Mike',
      lastName: 'Johnson',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    createdAt: '2024-01-08T00:00:00Z'
  }
  // Add remaining crops here...
]

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'herb', label: 'Herbs' },
  { value: 'fruit', label: 'Fruits' }
]

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' }
]

export default function CropsPage() {
  const router = useRouter()
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAvailability, setFilterAvailability] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  const handleDeleteCrop = async (cropId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this crop?')) return

    try {
      const response = await apiFetch(`/crops/${cropId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete crop')
      
      setCrops(prevCrops => prevCrops.filter(crop => crop._id !== cropId))
      toast.success('Crop deleted successfully')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error deleting crop')
    }
  }

  const fetchCrops = async (useMockData = false) => {
    try {
      if (useMockData) {
        // Use mock data immediately for development
        setCrops(MOCK_CROPS)
        setLoading(false)
        return
      }

      const response = await apiFetch('/crops')
      if (!response.ok) {
        throw new Error('Failed to fetch crops')
      }
      const data = await response.json()
      const cropsData = data.crops || []
      
      setCrops(cropsData.length > 0 ? cropsData : MOCK_CROPS)
      setError(null)
    } catch (error) {
      console.error('Error fetching crops:', error)
      setError('Failed to load crops. Using sample data.')
      setCrops(MOCK_CROPS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrops()
  }, [])

  const refreshCrops = async () => {
    setRefreshing(true)
    try {
      const response = await apiFetch('/crops')
      if (!response.ok) {
        throw new Error('Failed to fetch crops')
      }
      const data = await response.json()
      const cropsData = data.crops || []
      
      if (cropsData.length > 0) {
        setCrops(cropsData)
        setError(null)
      }
    } catch (error) {
      console.error('Error refreshing crops:', error)
      setError('Failed to refresh crops')
    } finally {
      setRefreshing(false)
    }
  }

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.variety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || crop.category === filterCategory
    const matchesAvailability = filterAvailability === 'all' || crop.availability === filterAvailability
    
    return matchesSearch && matchesCategory && matchesAvailability
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vegetable': return 'bg-green-100 text-green-800'
      case 'herb': return 'bg-purple-100 text-purple-800'
      case 'fruit': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCropClick = (cropId: string) => {
    router.push(`/crops/${cropId}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Available Crops</h1>
            <p className="text-gray-600 mt-1">Discover fresh produce from local community gardens</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={refreshCrops}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh crops"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/crops/create" className="btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              List Your Crops
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search crops by name, variety, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent min-w-[150px]"
              >
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent min-w-[150px]"
              >
                {AVAILABILITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-green text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-green text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredCrops.length} of {crops.length} crops
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-primary-green hover:text-green-700"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Crops Grid/List */}
        {filteredCrops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <TreePine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No crops found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <div className="space-x-3">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('all')
                  setFilterAvailability('all')
                }}
                className="btn-primary"
              >
                Clear all filters
              </button>
              <Link href="/crops/create" className="btn-secondary">
                List New Crop
              </Link>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredCrops.map((crop) => (
              <div 
                key={crop._id} 
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => handleCropClick(crop._id)}
              >
                {/* Image Gallery */}
                <div className={`
                  relative group overflow-hidden
                  ${viewMode === 'list' 
                    ? 'w-48 h-48 rounded-l-lg flex-shrink-0' 
                    : 'h-48 rounded-t-lg'
                  }
                `}>
                  <Image
                    src={crop.images?.[0]?.url || '/placeholder-crop.jpg'}
                    alt={crop.images?.[0]?.caption || crop.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes={viewMode === 'list' ? "192px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                  />
                  
                  {/* Image count indicator */}
                  {crop.images && crop.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                      +{crop.images.length - 1} more
                    </div>
                  )}
                  
                  {/* Price/Free Badge */}
                  <div className="absolute top-3 right-3">
                    {crop.isFree ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center shadow-sm">
                        <Gift className="h-3 w-3 mr-1" />
                        Free
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center shadow-sm">
                        ₹{crop.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{crop.name}</h3>
                      {crop.variety && (
                        <p className="text-sm text-gray-600 truncate">{crop.variety}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${getCategoryColor(crop.category)}`}>
                      {crop.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{crop.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Leaf className="h-4 w-4 mr-2 text-primary-green flex-shrink-0" />
                      <span className="truncate">{crop.quantity.amount} {crop.quantity.unit}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-primary-green flex-shrink-0" />
                      <span className="truncate">{crop.garden.location.city}, {crop.garden.location.state}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-primary-green flex-shrink-0" />
                      <span className="truncate">Harvested {formatDate(crop.harvestDate)}</span>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center min-w-0">
                      {crop.owner.profileImage ? (
                        <Image
                          src={crop.owner.profileImage}
                          alt={`${crop.owner.firstName || crop.owner.username} ${crop.owner.lastName || ''}`.trim()}
                          width={32}
                          height={32}
                          className="rounded-full mr-3 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-600">
                            {(crop.owner.firstName?.[0] || crop.owner.username?.[0] || 'U').toUpperCase()}{(crop.owner.lastName?.[0] || '').toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {(crop.owner.firstName || crop.owner.username || 'Unknown') + (crop.owner.lastName ? ` ${crop.owner.lastName}` : '')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">@{crop.owner.username || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3 flex-shrink-0">
                      <button 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        onClick={(e) => handleDeleteCrop(crop._id, e)}
                        title="Delete crop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="btn-primary text-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCropClick(crop._id)
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
