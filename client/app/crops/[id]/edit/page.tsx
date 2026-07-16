'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, X } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
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
  availability: string
  growingMethod: string
  images: Array<{
    url: string
    caption: string
    file?: File
  }>
  garden: string
  season: string
  tags: string[]
}

export default function EditCropPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [formData, setFormData] = useState<CropFormData>({
    name: '',
    variety: '',
    description: '',
    category: 'vegetable',
    quantity: { amount: 0, unit: 'kg' },
    harvestDate: '',
    price: 0,
    isFree: false,
    availability: 'available',
    growingMethod: 'conventional',
    images: [],
    garden: '',
    season: 'summer',
    tags: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    const loadCrop = async () => {
      if (!params.id) return
      try {
        const response = await apiFetch(`/crops/${params.id}`)
        if (!response.ok) {
          throw new Error('Crop not found')
        }

        const data = await response.json()
        const crop = data.crop

        setFormData({
          name: crop.name || '',
          variety: crop.variety || '',
          description: crop.description || '',
          category: crop.category || 'vegetable',
          quantity: {
            amount: crop.quantity?.amount || 0,
            unit: crop.quantity?.unit || 'kg'
          },
          harvestDate: crop.harvestDate ? new Date(crop.harvestDate).toISOString().slice(0, 10) : '',
          price: crop.price || 0,
          isFree: crop.isFree || false,
          availability: crop.availability || 'available',
          growingMethod: crop.growingMethod || 'conventional',
          images: Array.isArray(crop.images) ? crop.images.map((image: any) => ({
            url: image.url,
            caption: image.caption || ''
          })) : [],
          garden: crop.garden?._id || crop.garden || '',
          season: crop.season || 'summer',
          tags: Array.isArray(crop.tags) ? crop.tags : []
        })
      } catch (err) {
        console.error('Error loading crop for edit:', err)
        setError('Unable to load crop details.')
      } finally {
        setLoading(false)
      }
    }

    loadCrop()
  }, [params.id])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      caption: file.name,
      file
    }))

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }))
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed || formData.tags.includes(trimmed)) return
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, trimmed]
    }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((currentTag) => currentTag !== tag)
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!params.id) return

    setSaving(true)
    setError(null)

    try {
      const imagesWithBase64 = await Promise.all(
        formData.images.map(async (image) => {
          if (image.file) {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(image.file as File)
            })
            return { url: base64, caption: image.caption }
          }
          return { url: image.url, caption: image.caption }
        })
      )

      const response = await apiFetch(`/crops/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          quantity: {
            amount: Number(formData.quantity.amount),
            unit: formData.quantity.unit
          },
          images: imagesWithBase64
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || 'Failed to update crop')
      }

      router.push(`/crops/${params.id}`)
    } catch (err) {
      console.error('Update crop error:', err)
      setError((err as Error).message || 'Unable to update crop.')
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href={`/crops/${params.id}`} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Crop Listing</h1>
            <p className="text-gray-600 mt-1">Update your crop details and save changes.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Variety</label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData((prev) => ({ ...prev, variety: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Season *</label>
                <select
                  value={formData.season}
                  onChange={(e) => setFormData((prev) => ({ ...prev, season: e.target.value }))}
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

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quantity & Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity.amount}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    quantity: { ...prev.quantity, amount: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select
                  value={formData.quantity.unit}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    quantity: { ...prev.quantity, unit: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="pieces">pieces</option>
                  <option value="bunches">bunches</option>
                  <option value="bags">bags</option>
                  <option value="containers">containers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Date</label>
                <input
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, harvestDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Free Listing</label>
                <select
                  value={formData.isFree ? 'true' : 'false'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isFree: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Garden & Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garden</label>
                <input
                  type="text"
                  value={formData.garden}
                  onChange={(e) => setFormData((prev) => ({ ...prev, garden: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="Existing garden ID or name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="harvested">Harvested</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Growing Method</label>
              <select
                value={formData.growingMethod}
                onChange={(e) => setFormData((prev) => ({ ...prev, growingMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="conventional">Conventional</option>
                <option value="organic">Organic</option>
                <option value="hydroponic">Hydroponic</option>
                <option value="permaculture">Permaculture</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
            <div className="grid grid-cols-1 gap-4">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600 hover:border-primary-green hover:bg-green-50">
                <Upload className="h-5 w-5" />
                <span>Select images to upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.caption || 'Crop image'}
                        width={500}
                        height={300}
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 rounded-full bg-white p-1 shadow"
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </button>
                      <div className="p-3 text-xs text-gray-600">{image.caption || 'No caption'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="Add a tag and press Add"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-gray-900">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <Link href={`/crops/${params.id}`} className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
