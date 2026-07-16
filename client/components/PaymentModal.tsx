'use client'

import React, { useState, useEffect } from 'react'
import { X, MapPin, CheckCircle, Smartphone, DollarSign, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import PaymentForm from './PaymentForm'
import { API_URL } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  cropId: string
  sellerId: string
  quantity: number
  totalAmount: number
  cropName: string
  cropPrice: number
  cropUnit: string
}

interface SellerInfo {
  seller: {
    _id: string
    firstName: string
    lastName: string
    username: string
    email: string
    phoneNumber?: string
    upiId?: string
    profileImage?: string
    location?: {
      address?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
      coordinates?: {
        lat?: number
        lng?: number
      }
    }
    gardenName?: string
  }
  crop: {
    _id: string
    name: string
    price: number
    quantity: {
      amount: number
      unit: string
    }
  }
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cropId,
  sellerId,
  quantity,
  totalAmount,
  cropName,
  cropPrice,
  cropUnit
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'gpay' | 'phonepe' | 'paytm' | 'cod'>('upi')
  const [successData, setSuccessData] = useState<any | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchSellerInfo()
      setSuccessData(null)
    }
  }, [isOpen, cropId])

  const fetchSellerInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payments/crop/${cropId}/seller-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch seller information')
      }

      const data = await response.json()
      setSellerInfo(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load seller information'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (details: any) => {
    // Save success details to state and trigger the success receipt view
    setSuccessData(details || {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      sellerName: sellerInfo ? `${sellerInfo.seller.firstName} ${sellerInfo.seller.lastName}` : 'Seller',
      sellerPhone: sellerInfo?.seller.phoneNumber || 'Not provided',
      sellerPhoto: sellerInfo?.seller.profileImage || '',
      quantity: `${quantity} ${cropUnit}`,
      totalPaid: totalAmount,
      paymentMethod: selectedMethod === 'cod' ? 'CASH' : 'ONLINE',
      purchaseDate: new Date().toISOString()
    })
  }

  if (!isOpen) return null

  // Address assembly for Maps
  const getFullAddress = () => {
    if (!sellerInfo?.seller.location) return ''
    const { address, city, state, country } = sellerInfo.seller.location
    return [address, city, state, country].filter(Boolean).join(', ')
  }

  // Navigate to internal central map page
  const handleOpenLocation = () => {
    router.push(`/map?sellerId=${sellerId}`)
  }

  // UPI URL construction
  const getUpiUrl = () => {
    const upiId = sellerInfo?.seller.upiId && sellerInfo.seller.upiId !== 'seller@upi'
      ? sellerInfo.seller.upiId
      : 'seller@upi'
    const sellerName = sellerInfo ? `${sellerInfo.seller.firstName} ${sellerInfo.seller.lastName}` : 'Seller'
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(sellerName)}&am=${totalAmount}&cu=INR`
  }

  const upiUrl = getUpiUrl()
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`

  // Map selection keys to backend format
  const getBackendMethod = (): 'ONLINE' | 'CASH' => {
    return selectedMethod === 'cod' ? 'CASH' : 'ONLINE'
  }

  const getBackendApp = (): 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Other' => {
    if (selectedMethod === 'gpay') return 'Google Pay'
    if (selectedMethod === 'phonepe') return 'PhonePe'
    if (selectedMethod === 'paytm') return 'Paytm'
    return 'Other'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🌱 checkout
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-green-700 rounded-full p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              <p className="text-gray-500 text-sm">Fetching seller details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center">
              <p className="font-medium text-lg mb-2">Error Loading Details</p>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchSellerInfo}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Try Again
              </button>
            </div>
          ) : successData ? (
            /* Success Receipt Screen */
            <div className="space-y-6 text-center py-4">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-16 w-16 text-green-500 animate-bounce mb-3" />
                <h3 className="text-2xl font-extrabold text-gray-900">Order Placed Successfully!</h3>
                <p className="text-gray-500 text-sm mt-1">Thank you for sharing with your community.</p>
              </div>

              {/* Order Details Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-left max-w-md mx-auto space-y-4">
                <div className="flex justify-between border-b pb-2 text-sm text-emerald-800">
                  <span className="font-semibold">Order ID:</span>
                  <span className="font-mono">{successData.orderId}</span>
                </div>

                {/* Seller Profile Block */}
                <div className="flex items-center gap-3 py-2">
                  {successData.sellerPhoto ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border">
                      <Image
                        src={successData.sellerPhoto}
                        alt={successData.sellerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-lg">
                      {successData.sellerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Seller Name</p>
                    <p className="text-sm font-bold text-gray-800">{successData.sellerName}</p>
                    <p className="text-xs text-green-700 font-medium">📞 {successData.sellerPhone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-t pt-3">
                  <div>
                    <span className="text-gray-500 block">Quantity</span>
                    <span className="font-bold text-gray-800">{successData.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Total Price</span>
                    <span className="font-bold text-green-700 text-sm">₹{successData.totalPaid}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Method</span>
                    <span className="font-semibold px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-800 capitalize">
                      {successData.paymentMethod.toLowerCase() === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Purchase Date</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(successData.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow"
              >
                Close Window
              </button>
            </div>
          ) : sellerInfo ? (
            /* Regular checkout process */
            <div className="space-y-6">
              {/* Seller Information Details Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-md font-bold text-green-900 mb-4 flex items-center gap-2">
                  🧑‍🌾 Seller Information
                </h3>

                <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                  {/* Seller Profile Photo */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    {sellerInfo.seller.profileImage ? (
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-green-400">
                        <Image
                          src={sellerInfo.seller.profileImage}
                          alt={sellerInfo.seller.firstName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-2xl border-2 border-green-400">
                        {sellerInfo.seller.firstName.slice(0, 1).toUpperCase()}
                        {sellerInfo.seller.lastName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Details List */}
                  <div className="flex-1 space-y-2 text-sm w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                      <p className="text-gray-700">
                        <span className="text-gray-500">Name:</span> <strong className="text-gray-900">{sellerInfo.seller.firstName} {sellerInfo.seller.lastName}</strong>
                      </p>
                      <p className="text-gray-700">
                        <span className="text-gray-500">Username:</span> <span className="font-semibold text-gray-900">@{sellerInfo.seller.username}</span>
                      </p>
                      <p className="text-gray-700">
                        <span className="text-gray-500">Phone:</span> <strong className="text-green-700">{sellerInfo.seller.phoneNumber || 'Not provided'}</strong>
                      </p>
                      <p className="text-gray-700">
                        <span className="text-gray-500">Email:</span> <span className="text-gray-900">{sellerInfo.seller.email}</span>
                      </p>
                      <p className="text-gray-700 md:col-span-2">
                        <span className="text-gray-500">Garden Name:</span> <strong className="text-gray-900">{sellerInfo.seller.gardenName}</strong>
                      </p>
                    </div>

                    {/* Address block */}
                    {sellerInfo.seller.location?.address && (
                      <div className="border-t border-green-150 pt-2 mt-2">
                        <p className="text-xs text-gray-500">Location Address</p>
                        <p className="text-xs text-gray-700">
                          {sellerInfo.seller.location.address}, {sellerInfo.seller.location.city}, {sellerInfo.seller.location.state}, {sellerInfo.seller.location.country || 'India'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Maps Location Button */}
                <div className="mt-4 border-t pt-4 flex justify-end">
                  <button
                    onClick={handleOpenLocation}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-green-50 text-green-700 border border-green-400 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm"
                  >
                    <MapPin size={16} className="text-green-600" />
                    Open Seller Location (Google Maps)
                  </button>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">🛒 Purchase Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="text-gray-500 text-xs block">Crop Listing</span>
                    <strong className="text-gray-800">{cropName}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="text-gray-500 text-xs block">Price per Unit</span>
                    <strong className="text-gray-800">₹{cropPrice}/{cropUnit}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="text-gray-500 text-xs block">Quantity</span>
                    <strong className="text-gray-800">{quantity} {cropUnit}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="text-gray-500 text-xs block">Buyer Name</span>
                    <strong className="text-gray-850 truncate block">
                      {user ? `${user.firstName} ${user.lastName}` : 'Community Member'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="text-gray-500 text-xs block">Payment Mode</span>
                    <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-800 rounded">
                      {selectedMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-300 bg-green-50 text-right">
                    <span className="text-green-700 text-xs block">Total Payable</span>
                    <strong className="text-green-800 text-xl">₹{totalAmount}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection Tab Row */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('upi')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      selectedMethod === 'upi'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <QrCode size={20} className="mb-1 text-green-600" />
                    <span className="text-xs font-bold">UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('gpay')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      selectedMethod === 'gpay'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Smartphone size={20} className="mb-1 text-blue-600" />
                    <span className="text-xs font-bold">Google Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('phonepe')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      selectedMethod === 'phonepe'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Smartphone size={20} className="mb-1 text-purple-600" />
                    <span className="text-xs font-bold">PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('paytm')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      selectedMethod === 'paytm'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Smartphone size={20} className="mb-1 text-sky-500" />
                    <span className="text-xs font-bold">Paytm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cod')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      selectedMethod === 'cod'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <DollarSign size={20} className="mb-1 text-amber-600" />
                    <span className="text-xs font-bold">COD</span>
                  </button>
                </div>
              </div>

              {/* QR Code UPI Card Section */}
              {selectedMethod !== 'cod' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center shadow-inner">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Scan UPI QR to Pay</h4>
                  
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 inline-block shadow-sm">
                    {/* QR Code Image element pointing to dynamic server QR generator */}
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>

                  {/* QR Sub-Details */}
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-gray-500">UPI Address:</p>
                    <p className="text-sm font-mono font-bold text-green-700 select-all">
                      {sellerInfo.seller.upiId || 'seller@upi'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Seller Name: <span className="font-semibold text-gray-800">{sellerInfo.seller.firstName} {sellerInfo.seller.lastName}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Amount: <span className="font-bold text-green-700">₹{totalAmount}</span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                    Open your GPay, PhonePe, Paytm, or BHIM app and scan the QR code above.<br />
                    Complete the transaction and submit your Transaction ID below.
                  </p>
                </div>
              )}

              {/* Payment details submission form */}
              <PaymentForm
                sellerId={sellerId}
                cropId={cropId}
                quantity={quantity}
                totalAmount={totalAmount}
                paymentMethod={getBackendMethod()}
                onSuccess={handleSuccess}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
