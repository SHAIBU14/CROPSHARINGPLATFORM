'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useDropzone } from 'react-dropzone'
import { 
  ArrowLeft, 
  Upload, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Gift,
  Leaf,
  Image as ImageIcon,
  X
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiFetch } from '@/lib/api'

interface CropFormData {
  name: string
  variety: string
  description: string
  category: string
  quantity: {
    amount: number
    unit: string
  }
  harvestDate: string
  price: number
  isFree: boolean
  images: Array<{
    url: string
    caption: string
    file?: File
  }>
  garden: string
  season: string
  growingMethod: string
  tags: string[]
  location?: {
    coordinates: {
      lat: number
      lng: number
    }
  }
}

export default function CreateCropPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CropFormData>({
    name: '',
    variety: '',
    description: '',
    category: 'vegetable',
    quantity: { amount: 0, unit: 'kg' },
    harvestDate: '',
    price: 0,
    isFree: true,
    images: [],
    garden: '',
    season: 'summer',
    growingMethod: 'conventional',
    tags: [],
    location: {
      coordinates: { lat: 0, lng: 0 }
    }
  })

  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')

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

      const response = await apiFetch('/crops', {
        method: 'POST',
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error('Failed to create crop')
      }

      const result = await response.json()
      console.log('Crop created:', result)

      // Redirect to crops page
      router.push('/crops')
    } catch (error) {
      console.error('Error creating crop:', error)
      alert('Failed to create crop. Please try again.')
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/crops" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Crop Listing</h1>
            <p className="text-gray-600 mt-1">Share your fresh produce with the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="e.g., Cherry Tomatoes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variety
                </label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="e.g., Organic, Heirloom"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="Describe your crop, growing conditions, taste, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="vegetable">Vegetable</option>
                  <option value="herb">Herb</option>
                  <option value="fruit">Fruit</option>
                  <option value="flower">Flower</option>
                  <option value="grain">Grain</option>
                  <option value="legume">Legume</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season *
                </label>
                <select
                  required
                  value={formData.season}
                  onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                  <option value="year-round">Year-round</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quantity and Pricing */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quantity & Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity.amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: { ...prev.quantity, amount: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  required
                  value={formData.quantity.unit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: { ...prev.quantity, unit: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="pieces">Pieces</option>
                  <option value="bunches">Bunches</option>
                  <option value="bags">Bags</option>
                  <option value="containers">Containers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harvest Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.harvestDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true, price: 0 }))}
                    className="mr-2"
                  />
                  <Gift className="h-4 w-4 mr-1 text-green-600" />
                  Free to Share
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                    className="mr-2"
                  />
                  <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
                  For Sale
                </label>
              </div>
              
              {!formData.isFree && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
              )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location?.coordinates?.lat || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { 
                        ...prev.location, 
                        coordinates: { ...(prev.location?.coordinates || {lat:0, lng:0}), lat: Number(e.target.value) }
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
                    value={formData.location?.coordinates?.lng || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { 
                        ...prev.location, 
                        coordinates: { ...(prev.location?.coordinates || {lat:0, lng:0}), lng: Number(e.target.value) }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    placeholder="-122.4194"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Crop Images</h2>
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

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="Add tags (press Enter)"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/crops"
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
                  <Leaf className="h-4 w-4 mr-2" />
                  Create Crop Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
