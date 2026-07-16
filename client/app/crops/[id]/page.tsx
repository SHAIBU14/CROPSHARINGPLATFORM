'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Gift, Leaf, MapPin, User } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import PaymentModal from '@/components/PaymentModal'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface CropDetails {
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
    }
  }
  owner: {
    _id: string
    firstName: string
    lastName: string
    username: string
  }
}

export default function CropDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [crop, setCrop] = useState<CropDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [quantityToBuy, setQuantityToBuy] = useState<number>(1)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  useEffect(() => {
    const loadCrop = async () => {
      try {
        const response = await apiFetch(`/crops/${params.id}`)

        if (!response.ok) {
          throw new Error('Crop not found')
        }

        const data = await response.json()
        setCrop(data.crop)
      } catch (err) {
        console.error('Error loading crop:', err)
        setError('This crop could not be loaded.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadCrop()
    }
  }, [params.id])

  useEffect(() => {
    if (!crop) {
      setTotalPrice(0)
      return
    }

    setTotalPrice(crop.isFree ? 0 : crop.price * quantityToBuy)
  }, [crop, quantityToBuy])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
        </div>
      </DashboardLayout>
    )
  }

  const handlePurchase = async () => {
    if (!crop) return

    const quantity = Number(quantityToBuy)
    if (!Number.isInteger(quantity) || quantity < 1) {
      setCheckoutError('Please enter a valid purchase quantity.')
      return
    }

    if (quantity > crop.quantity.amount) {
      setCheckoutError(`Only ${crop.quantity.amount} ${crop.quantity.unit} available for purchase.`)
      return
    }

    // If online payment is selected, open the payment modal
    if (paymentMethod === 'online') {
      setIsPaymentModalOpen(true)
      return
    }

    // Handle Cash on Delivery
    setCheckoutLoading(true)
    setCheckoutError(null)
    setCheckoutMessage(null)

    try {
      const response = await apiFetch(`/crops/${params.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, quantity })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || 'Checkout failed')
      }

      const data = await response.json()
      setCheckoutMessage(data.message || 'Order completed successfully.')

      if (data.remainingQuantity !== undefined) {
        setCrop(prevCrop => prevCrop ? {
          ...prevCrop,
          quantity: {
            ...prevCrop.quantity,
            amount: data.remainingQuantity
          }
        } : prevCrop)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setCheckoutError((err as Error).message || 'Checkout failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleDeleteCrop = async () => {
    if (!crop || deleteLoading) return
    if (!confirm('Delete this crop listing? This action cannot be undone.')) return

    setDeleteLoading(true)
    setCheckoutError(null)

    try {
      const response = await apiFetch(`/crops/${params.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || 'Failed to delete crop')
      }
      router.push('/crops')
    } catch (err) {
      console.error('Delete crop error:', err)
      setCheckoutError((err as Error).message || 'Unable to delete crop listing.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const isOwner = Boolean(user && crop && String(user._id) === String(crop.owner?._id))

  if (error || !crop) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Crop not available</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested crop no longer exists.'}</p>
            <Link href="/crops" className="btn-primary inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to crops
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
          <Link href="/crops" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{crop.name}</h1>
            <p className="text-gray-600 mt-1">{crop.variety || crop.category}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="relative h-80 bg-gray-100">
              {crop.images?.[0]?.url ? (
                <Image
                  src={crop.images[0].url}
                  alt={crop.images[0].caption || crop.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <Leaf className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 capitalize">
                {crop.category}
              </span>
              {crop.isFree ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  <Gift className="h-4 w-4 mr-1" />
                  Free
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  ₹
                  {crop.price}
                </span>
              )}
            </div>

            <p className="text-gray-700">{crop.description || 'No description provided for this crop.'}</p>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Leaf className="h-4 w-4 mr-2 text-primary-green" />
                <span>{crop.quantity.amount} {crop.quantity.unit}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary-green" />
                <span>Harvested {new Date(crop.harvestDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary-green" />
                <span>{crop.garden?.name}, {crop.garden?.location?.city}, {crop.garden?.location?.state}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-primary-green" />
                <span>{crop.owner?.firstName} {crop.owner?.lastName} (@{crop.owner?.username})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Checkout</h2>
          <p className="text-sm text-gray-600">Choose a payment option and confirm your purchase.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`rounded-lg border p-4 text-left transition ${paymentMethod === 'cod' ? 'border-primary-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <span className="block text-sm font-semibold text-gray-900">Cash on Delivery</span>
              <span className="text-xs text-gray-600">Pay when the crop arrives.</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`rounded-lg border p-4 text-left transition ${paymentMethod === 'online' ? 'border-primary-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <span className="block text-sm font-semibold text-gray-900">Online Payment</span>
              <span className="text-xs text-gray-600">Simulate a secure checkout now.</span>
            </button>
          </div>

          {!user ? (
            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-700">
              Please <Link href="/auth/login" className="font-semibold text-primary-green underline">log in</Link> to proceed with checkout.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <Link href={`/crops/${params.id}/edit`} className="btn-secondary">
                  Edit Listing
                </Link>
                <button
                  type="button"
                  onClick={handleDeleteCrop}
                  disabled={deleteLoading}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Listing'}
                </button>
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {checkoutError}
            </div>
          )}

          {checkoutMessage && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
              {checkoutMessage}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <label className="block">
              <span className="text-sm font-medium text-gray-900">Quantity to buy</span>
              <input
                type="number"
                min={1}
                max={crop.quantity.amount}
                value={quantityToBuy}
                onChange={(event) => setQuantityToBuy(Number(event.target.value))}
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-green focus:outline-none focus:ring-2 focus:ring-primary-green/20"
              />
            </label>
            <div className="text-sm text-gray-600">
              Available: <span className="font-semibold text-gray-900">{crop.quantity.amount} {crop.quantity.unit}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <button
              type="button"
              onClick={handlePurchase}
              disabled={checkoutLoading || !user}
              className="btn-primary"
            >
              {checkoutLoading ? 'Processing...' : crop.isFree ? 'Reserve for Free' : 'Confirm Purchase'}
            </button>
            <p className="text-sm text-gray-600">
              Total: <strong>₹{totalPrice}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cropId={crop._id}
        sellerId={crop.owner._id}
        quantity={quantityToBuy}
        totalAmount={totalPrice}
        cropName={crop.name}
        cropPrice={crop.price}
        cropUnit={crop.quantity.unit}
      />
    </DashboardLayout>
  )
}
