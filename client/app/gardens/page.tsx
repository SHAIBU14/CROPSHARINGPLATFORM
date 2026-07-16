'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Plus, 
  MapPin, 
  Star, 
  Calendar,
  Search,
  Grid,
  List,
  TreePine,
  RefreshCw,
  Edit3,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiFetch } from '@/lib/api'

interface Garden {
  _id: string
  name: string
  description: string
  location: {
    city: string
    state: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  size: string
  gardenType: string
  images: Array<{
    url: string
    caption: string
  }>
  averageRating: number
  visitors: Array<{
    user: string
    visitedAt: string
  }>
  owner: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  createdAt: string
}

export default function GardensPage() {
  const router = useRouter()
  const [gardens, setGardens] = useState<Garden[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [refreshing, setRefreshing] = useState(false)
  const [gardenCropNames, setGardenCropNames] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const fetchGardens = async () => {
      try {
        // Real API call
        const response = await apiFetch('/gardens')
        if (!response.ok) {
          throw new Error('Failed to fetch gardens')
        }
        const data = await response.json()
        const gardens = Array.isArray(data.gardens) ? data.gardens : []

        // Map crop names to gardens if available
        const cropsResponse = await apiFetch('/crops')
        const cropsData = cropsResponse.ok ? await cropsResponse.json() : { crops: [] }
        const crops = Array.isArray(cropsData.crops) ? cropsData.crops : []
        const cropMap: Record<string, string[]> = {}
        crops.forEach((crop: any) => {
          const gardenId = crop.garden?._id || crop.garden || crop.gardenId
          const cropName = crop.name || 'Crop'
          if (gardenId) {
            cropMap[gardenId] = cropMap[gardenId] || []
            if (!cropMap[gardenId].includes(cropName)) {
              cropMap[gardenId].push(cropName)
            }
          }
        })
        setGardenCropNames(cropMap)

        setGardens(gardens)
      } catch (error) {
        console.error('Error fetching gardens:', error)
        setGardens([])
      } finally {
        setLoading(false)
      }
    }

    fetchGardens()
  }, [])

  const refreshGardens = async () => {
    setRefreshing(true)
    try {
      const response = await apiFetch('/gardens')
      if (!response.ok) {
        throw new Error('Failed to fetch gardens')
      }
      const data = await response.json()
      const gardens = Array.isArray(data.gardens) ? data.gardens : []
      setGardens(gardens)

      const cropsResponse = await apiFetch('/crops')
      const cropsData = cropsResponse.ok ? await cropsResponse.json() : { crops: [] }
      const crops = Array.isArray(cropsData.crops) ? cropsData.crops : []
      const cropMap: Record<string, string[]> = {}
      crops.forEach((crop: any) => {
        const gardenId = crop.garden?._id || crop.garden || crop.gardenId
        const cropName = crop.name || 'Crop'
        if (gardenId) {
          cropMap[gardenId] = cropMap[gardenId] || []
          if (!cropMap[gardenId].includes(cropName)) {
            cropMap[gardenId].push(cropName)
          }
        }
      })
      setGardenCropNames(cropMap)
    } catch (error) {
      console.error('Error refreshing gardens:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteGarden = async (gardenId: string) => {
    if (!confirm('Delete this garden? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiFetch(`/gardens/${gardenId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete garden')
      }
      setGardens((prev) => prev.filter((garden) => garden._id !== gardenId))
    } catch (error) {
      console.error('Error deleting garden:', error)
      alert('Unable to delete garden.')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredGardens = gardens.filter(garden => {
    const matchesSearch = garden.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         garden.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         garden.location.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || garden.gardenType === filterType
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Gardens</h1>
            <p className="text-gray-600 mt-1">Discover and connect with gardens in your area</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={refreshGardens}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh gardens"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/gardens/create" className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Add Garden
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search gardens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                <option value="vegetable">Vegetable</option>
                <option value="herb">Herb</option>
                <option value="fruit">Fruit</option>
                <option value="flower">Flower</option>
                <option value="mixed">Mixed</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="btn-outline px-3"
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Gardens Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGardens.map((garden) => (
              <div key={garden._id} className="card hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden group">
                  {garden.images?.[0]?.url ? (
                    <Image
                      src={garden.images[0].url}
                      alt={garden.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <TreePine className="h-16 w-16" />
                    </div>
                  )}
                  
                  {/* Image count indicator */}
                  {garden.images && garden.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                      {garden.images.length} photos
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{garden.averageRating ?? 0}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{garden.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{garden.description}</p>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {garden.location?.city || 'Unknown'}, {garden.location?.state || 'Unknown'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {gardenCropNames[garden._id]?.length ? `₹{gardenCropNames[garden._id].length} crop(s)` : 'No crops yet'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <strong className="block text-gray-900">Owner</strong>
                      {garden.owner?.firstName || 'Unknown'} {garden.owner?.lastName || ''}
                    </div>
                    <div>
                      <strong className="block text-gray-900">Size</strong>
                      {garden.size || 'N/A'}
                    </div>
                    <div>
                      <strong className="block text-gray-900">Type</strong>
                      {garden.gardenType || 'N/A'}
                    </div>
                    <div>
                      <strong className="block text-gray-900">Created</strong>
                      {formatDate(garden.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/gardens/${garden._id}`}
                      className="flex-1 btn-primary text-center"
                    >
                      View Garden
                    </Link>
                    <Link
                      href={`/gardens/${garden._id}/edit`}
                      className="btn-outline px-3 py-2 rounded-lg text-sm"
                    >
                      <Edit3 className="h-4 w-4 inline-block mr-1" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteGarden(garden._id)}
                      className="btn-danger px-3 py-2 rounded-lg text-sm"
                    >
                      <Trash2 className="h-4 w-4 inline-block mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGardens.map((garden) => (
              <div key={garden._id} className="card">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group">
                    {garden.images[0] ? (
                      <Image
                        src={garden.images[0].url}
                        alt={garden.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-2xl">🌱</span>
                      </div>
                    )}
                    
                    {/* Image count indicator for list view */}
                    {garden.images && garden.images.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                        {garden.images.length}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {garden.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {garden.description}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{garden.location.city}, {garden.location.state}</span>
                          <span className="mx-2">•</span>
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{garden.averageRating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="text-right">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-primary-green rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-medium">
                                {garden.owner.firstName[0]}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {garden.owner.firstName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 capitalize">
                            {garden.size} • {garden.gardenType}
                          </span>
                        </div>
                        <Link
                          href={`/gardens/${garden._id}`}
                          className="btn-primary"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredGardens.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No gardens found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to add a garden to your community!'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
