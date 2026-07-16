'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Star, TreePine, User } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiFetch } from '@/lib/api'

interface GardenDetails {
  _id: string
  name: string
  description: string
  size: string
  gardenType: string
  averageRating: number
  images: Array<{
    url: string
    caption: string
  }>
  location: {
    address?: string
    city: string
    state: string
    zipCode?: string
  }
  owner: {
    firstName: string
    lastName: string
    username: string
  }
}

export default function GardenDetailsPage() {
  const params = useParams<{ id: string }>()
  const [garden, setGarden] = useState<GardenDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadGarden = async () => {
      try {
        const response = await apiFetch(`/gardens/${params.id}`)

        if (!response.ok) {
          throw new Error('Garden not found')
        }

        const data = await response.json()
        setGarden(data.garden)
      } catch (err) {
        console.error('Error loading garden:', err)
        setError('This garden could not be loaded.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadGarden()
    }
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !garden) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Garden not available</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested garden no longer exists.'}</p>
            <Link href="/gardens" className="btn-primary inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to gardens
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/gardens" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{garden.name}</h1>
            <p className="text-gray-600 mt-1 capitalize">{garden.gardenType} garden</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="relative h-80 bg-gray-100">
              {garden.images?.[0]?.url ? (
                <Image
                  src={garden.images[0].url}
                  alt={garden.images[0].caption || garden.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <TreePine className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 capitalize">
                {garden.size}
              </span>
              <span className="inline-flex items-center text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 mr-1" />
                {garden.averageRating || 0}
              </span>
            </div>

            <p className="text-gray-700">{garden.description}</p>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary-green" />
                <span>
                  {[garden.location?.address, garden.location?.city, garden.location?.state, garden.location?.zipCode]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-primary-green" />
                <span>{garden.owner?.firstName} {garden.owner?.lastName} (@{garden.owner?.username})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
