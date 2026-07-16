'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useDropzone } from 'react-dropzone'
import { 
  ArrowLeft, 
  Upload, 
  MapPin, 
  Image as ImageIcon,
  X,
  TreePine,
  Leaf
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiFetch } from '@/lib/api'

interface GardenFormData {
  name: string
  description: string
  location: {
    address: string
    city: string
    state: string
    zipCode: string
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
    file?: File
  }>
  features: string[]
  isPublic: boolean
}

export default function CreateGardenPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<GardenFormData>({
    name: '',
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: 0, lng: 0 }
    },
    size: 'medium',
    gardenType: 'mixed',
    images: [],
    features: [],
    isPublic: true
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert image files to base64
      const imagesWithBase64 = await Promise.all(
        formData.images.map(async (image) => {
          if (image.file) {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(image.file as File)
            })
            return {
              url: base64,
              caption: image.caption
            }
          }
          return image
        })
      )

      const submitData = {
        ...formData,
        images: imagesWithBase64
      }

      const response = await apiFetch('/gardens', {
        method: 'POST',
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error('Failed to create garden')
      }

      const result = await response.json()
      console.log('Garden created:', result)

      // Redirect to gardens page
      router.push('/gardens')
    } catch (error) {
      console.error('Error creating garden:', error)
      alert('Failed to create garden. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      url: URL.createObjectURL(file),
      caption: file.name,
      file: file
    }))
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  })

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const availableFeatures = [
    'greenhouse',
    'compost',
    'irrigation',
    'raised-beds',
    'organic',
    'permaculture'
  ]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/gardens" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Garden Profile</h1>
            <p className="text-gray-600 mt-1">Share your garden with the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garden Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="e.g., Sunny Side Community Garden"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="Describe your garden, what you grow, special features, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Garden Size *
                  </label>
                  <select
                    required
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  >
                    <option value="small">Small (under 100 sq ft)</option>
                    <option value="medium">Medium (100-500 sq ft)</option>
                    <option value="large">Large (500-1000 sq ft)</option>
                    <option value="extra-large">Extra Large (1000+ sq ft)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Garden Type *
                  </label>
                  <select
                    required
                    value={formData.gardenType}
                    onChange={(e) => setFormData(prev => ({ ...prev, gardenType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  >
                    <option value="vegetable">Vegetable Garden</option>
                    <option value="herb">Herb Garden</option>
                    <option value="fruit">Fruit Garden</option>
                    <option value="flower">Flower Garden</option>
                    <option value="mixed">Mixed Garden</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps URL (Optional)
                </label>
                <input
                  type="text"
                  onChange={(e) => {
                    const match = e.target.value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
                    if (match && match.length >= 3) {
                      setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          coordinates: {
                            lat: parseFloat(match[1]),
                            lng: parseFloat(match[2])
                          }
                        }
                      }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent mb-4"
                  placeholder="Paste URL to auto-fill latitude and longitude below"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="Street address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.location.zipCode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, zipCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.lat}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { 
                        ...prev.location, 
                        coordinates: { ...prev.location.coordinates, lat: Number(e.target.value) }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="37.7749"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.lng}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { 
                        ...prev.location, 
                        coordinates: { ...prev.location.coordinates, lng: Number(e.target.value) }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="-122.4194"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Garden Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="rounded border-gray-300 text-primary-green focus:ring-primary-green"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Garden Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-32 rounded-lg overflow-hidden">
                    <Image
                      src={image.url}
                      alt={image.caption}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(e) => {
                      const newImages = [...formData.images]
                      newImages[index].caption = e.target.value
                      setFormData(prev => ({ ...prev, images: newImages }))
                    }}
                    className="w-full mt-2 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="Image caption"
                  />
                </div>
              ))}
              <div
                {...getRootProps()}
                className={`h-32 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isDragActive
                    ? 'border-primary-green bg-green-50'
                    : 'border-gray-300 hover:border-primary-green hover:bg-green-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isDragActive ? 'Drop images here' : 'Add Image'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h2>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded border-gray-300 text-primary-green focus:ring-primary-green"
              />
              <label className="text-sm text-gray-700">
                Make this garden public (visible to other users)
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/gardens"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <TreePine className="h-4 w-4 mr-2" />
                  Create Garden Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
