'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { Search, MapPin } from 'lucide-react'
import { API_URL } from '@/lib/api'
import toast from 'react-hot-toast'

// Dynamically import InteractiveMap without SSR
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-green-50 rounded-xl min-h-[500px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading interactive map...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  const searchParams = useSearchParams()
  const sellerId = searchParams.get('sellerId')

  const [crops, setCrops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUrl, setSearchUrl] = useState('')
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number, lng: number } | null>(null)

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await fetch(`${API_URL}/crops`)
        if (response.ok) {
          const data = await response.json()
          setCrops(data.crops)
        }
      } catch (error) {
        console.error('Error fetching crops for map:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCrops()
  }, [])

  useEffect(() => {
    if (sellerId && crops.length > 0) {
      const targetCrop = crops.find(c => c.owner._id === sellerId && c.garden?.location?.coordinates?.lat)
      if (!targetCrop) {
        toast.error('The selected seller does not have any precise location available on the map.')
      }
    }
  }, [sellerId, crops])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchUrl.trim()) return

    // Regex to match coordinates in Google Maps URL, e.g., @37.7749,-122.4194
    const match = searchUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match && match.length >= 3) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      setSearchedLocation({ lat, lng })
    } else {
      toast.error('Could not parse coordinates from the provided URL. Make sure it contains @lat,lng format.')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-green-600 h-8 w-8" />
              Garden Map
            </h1>
            <p className="text-gray-600 mt-1">Discover gardens and crops near you</p>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Paste a Google Maps URL to search... (e.g. https://www.google.com/maps/place/.../@37.7749,-122.4194,15z)"
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Map Container */}
        <div className="h-[600px] w-full relative z-0">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <InteractiveMap 
              crops={crops} 
              focusedSellerId={sellerId} 
              searchedLocation={searchedLocation} 
            />
          )}
        </div>

        {/* Map Legend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" alt="Blue Marker" className="h-6 w-auto mr-3" />
              <span className="font-medium text-gray-900">Available Crops</span>
            </div>
            <p className="text-sm text-gray-600">Blue markers indicate sellers with available crops.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" alt="Red Marker" className="h-6 w-auto mr-3" />
              <span className="font-medium text-gray-900">Focused/Searched Location</span>
            </div>
            <p className="text-sm text-gray-600">Red markers indicate the searched location or the currently selected seller.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
