'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, MapPin } from 'lucide-react'
import { API_URL } from '@/lib/api'

// Dynamically import the SellerMap with SSR disabled
const SellerMap = dynamic(() => import('@/components/SellerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-green-50 rounded-xl min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading interactive map...</p>
      </div>
    </div>
  ),
})

interface SellerDetails {
  _id: string
  firstName: string
  lastName: string
  gardenName?: string
  location?: {
    address?: string
    city?: string
    state?: string
    country?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
}

export default function SellerLocationPage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = params.id as string

  const [seller, setSeller] = useState<SellerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/users/${sellerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch seller location details')
        }

        const data = await response.json()
        setSeller(data.user)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (sellerId) {
      fetchSeller()
    }
  }, [sellerId])

  const formatAddress = () => {
    if (!seller?.location) return 'No address provided'
    const { address, city, state, country } = seller.location
    return [address, city, state, country].filter(Boolean).join(', ')
  }

  const coordinates = seller?.location?.coordinates

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-green-600 h-8 w-8" />
              Seller Location
            </h1>
            <p className="text-gray-600 mt-1">View where you can collect your fresh produce</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-500">Retrieving seller coordinates...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="bg-red-50 text-red-700 p-6 rounded-xl inline-block">
                <h3 className="font-bold text-lg mb-2">Could Not Load Location</h3>
                <p>{error}</p>
                <button 
                  onClick={() => router.back()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Return to Checkout
                </button>
              </div>
            </div>
          ) : !coordinates || (coordinates.lat === 0 && coordinates.lng === 0) ? (
            <div className="p-12 text-center">
              <div className="bg-amber-50 text-amber-800 p-6 rounded-xl inline-block max-w-lg">
                <MapPin className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="font-bold text-xl mb-2">Location Not Available</h3>
                <p className="mb-4">
                  {seller?.firstName} {seller?.lastName} has not provided exact GPS coordinates for their garden.
                </p>
                <div className="bg-white p-4 rounded border border-amber-200 text-left">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Registered Address</span>
                  <span className="font-medium">{formatAddress()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              
              {/* Sidebar Info */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-r border-gray-200 flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-1">Seller</h3>
                  <p className="text-xl font-bold text-gray-900">{seller?.firstName} {seller?.lastName}</p>
                  {seller?.gardenName && (
                    <p className="text-sm font-semibold text-green-700 mt-1">{seller.gardenName}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-2">Address</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{formatAddress()}</p>
                </div>

                <div className="mt-auto pt-6 border-t border-green-200">
                  <p className="text-xs text-gray-500 mb-3">
                    Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </p>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`, '_blank')}
                    className="w-full bg-white border-2 border-green-600 text-green-700 font-bold py-2 px-4 rounded-lg hover:bg-green-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} />
                    Open in Maps App
                  </button>
                </div>
              </div>

              {/* Map View */}
              <div className="lg:col-span-3 h-[500px] lg:h-[600px] p-2 bg-gray-50">
                <SellerMap 
                  lat={coordinates.lat} 
                  lng={coordinates.lng} 
                  sellerName={`${seller?.firstName} ${seller?.lastName}`}
                  gardenName={seller?.gardenName}
                  address={formatAddress()}
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
