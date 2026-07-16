'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Upload, AlertCircle } from 'lucide-react'
import { API_URL } from '@/lib/api'

interface PaymentFormProps {
  sellerId: string
  cropId: string
  quantity: number
  totalAmount: number
  paymentMethod: 'ONLINE' | 'CASH'
  onSuccess: (successDetails: any) => void
}

interface PaymentFormData {
  transactionId: string
  paymentApp: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Other'
  paymentDate: string
  paymentTime: string
  notes?: string
  screenshot?: FileList
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  sellerId,
  cropId,
  quantity,
  totalAmount,
  paymentMethod,
  onSuccess
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<PaymentFormData>({
    defaultValues: {
      transactionId: '',
      paymentApp: 'Google Pay',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentTime: new Date().toTimeString().slice(0, 5),
      notes: ''
    }
  })

  const [loading, setLoading] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)

  // Pre-fill fields or trigger state changes when paymentMethod changes
  useEffect(() => {
    if (paymentMethod === 'CASH') {
      setValue('transactionId', `COD-${Date.now()}`)
    } else {
      setValue('transactionId', '')
    }
  }, [paymentMethod, setValue])

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setScreenshotFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setLoading(true)

      let txId = data.transactionId.trim()
      let app = data.paymentApp
      let dateTimeStr = new Date().toISOString()

      if (paymentMethod === 'CASH') {
        txId = `COD-${Date.now()}`
        app = 'Other'
      } else {
        // Validate transaction ID for ONLINE payments
        if (!txId) {
          toast.error('Transaction ID is required')
          setLoading(false)
          return
        }
        dateTimeStr = new Date(`${data.paymentDate}T${data.paymentTime}`).toISOString()
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('sellerId', sellerId)
      formData.append('cropId', cropId)
      formData.append('quantity', quantity.toString())
      formData.append('totalAmount', totalAmount.toString())
      formData.append('transactionId', txId)
      formData.append('paymentApp', app)
      formData.append('paymentDate', dateTimeStr)
      formData.append('paymentMethod', paymentMethod)
      formData.append('notes', data.notes || '')
      
      if (paymentMethod === 'ONLINE' && screenshotFile) {
        formData.append('screenshot', screenshotFile)
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit payment')
      }

      toast.success(paymentMethod === 'CASH' ? 'COD order placed successfully!' : 'Payment submitted successfully!')
      reset()
      setScreenshotFile(null)
      setScreenshotPreview(null)
      
      // Pass the successDetails back to the modal for receipt screen
      onSuccess(result.successDetails)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit payment'
      toast.error(errorMessage)
      console.error('Payment submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {paymentMethod === 'CASH' ? 'Confirm Delivery Address' : 'Payment Details'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {paymentMethod === 'ONLINE' && (
          <>
            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID *
              </label>
              <input
                type="text"
                placeholder="Enter transaction ID from UPI app"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.transactionId ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('transactionId', {
                  required: paymentMethod === 'ONLINE' ? 'Transaction ID is required' : false,
                  minLength: {
                    value: 5,
                    message: 'Transaction ID must be at least 5 characters'
                  }
                })}
                disabled={loading}
              />
              {errors.transactionId && (
                <p className="text-red-500 text-sm mt-1">{errors.transactionId.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">You can find this in your payment app's transaction history</p>
            </div>

            {/* Payment App Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment App Used *
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('paymentApp')}
                disabled={loading}
              >
                <option value="Google Pay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="BHIM">BHIM</option>
                <option value="Other">Other UPI App</option>
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('paymentDate', {
                    required: paymentMethod === 'ONLINE' ? 'Payment date is required' : false
                  })}
                  disabled={loading}
                />
                {errors.paymentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Time *
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('paymentTime', {
                    required: paymentMethod === 'ONLINE' ? 'Payment time is required' : false
                  })}
                  disabled={loading}
                />
                {errors.paymentTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentTime.message}</p>
                )}
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                disabled={loading}
                className="hidden"
                id="screenshot-input"
              />
              <label htmlFor="screenshot-input" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Upload Payment Screenshot (Optional)</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                <p className="text-xs text-gray-500">Recommended for faster verification</p>
              </label>
            </div>

            {/* Screenshot Preview */}
            {screenshotPreview && (
              <div className="relative border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">Screenshot Preview</p>
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot"
                      className="max-w-full max-h-48 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotFile(null)
                      setScreenshotPreview(null)
                    }}
                    className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {paymentMethod === 'CASH' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Cash on Delivery selected</p>
              <p className="text-xs text-emerald-700 mt-1">
                You will pay the seller <span className="font-bold">₹{totalAmount}</span> directly when you collect or receive the crops.
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {paymentMethod === 'CASH' ? 'Delivery Notes / Address Details (Optional)' : 'Additional Notes (Optional)'}
          </label>
          <textarea
            placeholder={paymentMethod === 'CASH' ? "Write specific details for delivery or pickup instructions here..." : "Any additional details about the payment..."}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            {...register('notes', {
              maxLength: {
                value: 500,
                message: 'Notes cannot exceed 500 characters'
              }
            })}
            disabled={loading}
          />
          {errors.notes && (
            <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Safety Warning */}
        {paymentMethod === 'ONLINE' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Security Warning</p>
              <p className="text-xs text-red-700 mt-1">
                Do not share your password, OTP, Gmail ID, PIN, or CVV. GardenShare will never ask for these details.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Processing Order...
            </>
          ) : (
            paymentMethod === 'CASH' ? 'Confirm Cash on Delivery Order' : 'Submit Payment'
          )}
        </button>
      </form>
    </div>
  )
}

export default PaymentForm
