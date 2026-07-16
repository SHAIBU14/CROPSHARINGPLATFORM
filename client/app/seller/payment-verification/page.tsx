'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, AlertCircle, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

interface PaymentData {
  _id: string
  buyerId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    username: string
  }
  cropId: {
    _id: string
    name: string
    images: Array<{ url: string }>
    price: number
  }
  quantity: {
    amount: number
    unit: string
  }
  totalAmount: number
  transactionId: string
  paymentApp: string
  paymentDate: string
  screenshot?: {
    url: string
  }
  paymentStatus: 'Pending Verification' | 'Verified' | 'Rejected'
  notes?: string
  createdAt: string
}

const SellerPaymentVerification = () => {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payments/seller`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch payments')

      const data = await response.json()
      setPayments(data.all || [])
    } catch (error) {
      toast.error('Failed to load payments')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyClick = (payment: PaymentData) => {
    setSelectedPayment(payment)
    setVerificationNotes('')
    setShowVerifyModal(true)
  }

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return

    try {
      setVerifyingId(selectedPayment._id)
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/payments/${selectedPayment._id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: verificationNotes })
      })

      if (!response.ok) throw new Error('Failed to verify payment')

      toast.success('Payment verified successfully!')
      setShowVerifyModal(false)
      fetchPayments()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to verify payment'
      toast.error(errorMsg)
    } finally {
      setVerifyingId(null)
    }
  }

  const handleRejectPayment = async (payment: PaymentData) => {
    if (!window.confirm('Are you sure you want to reject this payment?')) return

    try {
      setVerifyingId(payment._id)
      const token = localStorage.getItem('token')

      const reason = prompt('Enter reason for rejection (optional):')

      const response = await fetch(`${API_URL}/payments/${payment._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: reason || '' })
      })

      if (!response.ok) throw new Error('Failed to reject payment')

      toast.success('Payment rejected')
      fetchPayments()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reject payment'
      toast.error(errorMsg)
    } finally {
      setVerifyingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Verification':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'Verified':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'Rejected':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending Verification':
        return <Clock className="h-5 w-5" />
      case 'Verified':
        return <CheckCircle className="h-5 w-5" />
      case 'Rejected':
        return <XCircle className="h-5 w-5" />
      default:
        return null
    }
  }

  const filteredPayments = payments.filter(p => p.paymentStatus === (activeTab === 'pending' ? 'Pending Verification' : activeTab === 'verified' ? 'Verified' : 'Rejected'))

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Payment Verification</h1>
            <p className="text-gray-600 mt-2">Verify and manage online payments from buyers</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Clock size={18} />
                  Pending ({payments.filter(p => p.paymentStatus === 'Pending Verification').length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'verified'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  Verified ({payments.filter(p => p.paymentStatus === 'Verified').length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'rejected'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <XCircle size={18} />
                  Rejected ({payments.filter(p => p.paymentStatus === 'Rejected').length})
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No {activeTab} payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map(payment => (
                <div key={payment._id} className={`border rounded-lg p-6 ${getStatusColor(payment.paymentStatus)}`}>
                  <div className="flex justify-between items-start gap-4">
                    {/* Left Section - Buyer & Crop Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        {payment.cropId.images?.[0] && (
                          <img
                            src={payment.cropId.images[0].url}
                            alt={payment.cropId.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{payment.cropId.name}</h3>
                          <p className="text-sm opacity-75">
                            {payment.quantity.amount} {payment.quantity.unit}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium">Buyer</p>
                          <p className="opacity-75">
                            {payment.buyerId.firstName} {payment.buyerId.lastName}
                          </p>
                          <p className="text-xs opacity-60">@{payment.buyerId.username}</p>
                        </div>
                        <div>
                          <p className="font-medium">Contact</p>
                          <p className="opacity-75">{payment.buyerId.email}</p>
                          {payment.buyerId.phoneNumber && (
                            <p className="text-xs opacity-60">{payment.buyerId.phoneNumber}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Transaction ID</p>
                          <p className="font-mono opacity-75">{payment.transactionId}</p>
                        </div>
                        <div>
                          <p className="font-medium">Payment App</p>
                          <p className="opacity-75">{payment.paymentApp}</p>
                        </div>
                        <div>
                          <p className="font-medium">Amount</p>
                          <p className="text-lg font-bold">₹{payment.totalAmount}</p>
                        </div>
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="opacity-75">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>

                      {payment.notes && (
                        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
                          <p className="text-xs font-medium">Buyer's Notes</p>
                          <p className="text-sm opacity-75">{payment.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Status & Actions */}
                    <div className="flex flex-col gap-3 min-w-fit">
                      <div className="flex items-center gap-2 font-medium">
                        {getStatusIcon(payment.paymentStatus)}
                        <span>{payment.paymentStatus}</span>
                      </div>

                      {payment.screenshot && (
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = payment.screenshot!.url
                            link.target = '_blank'
                            link.click()
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-lg transition text-sm font-medium"
                        >
                          <ImageIcon size={16} />
                          View Screenshot
                        </button>
                      )}

                      {payment.paymentStatus === 'Pending Verification' && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleVerifyClick(payment)}
                            disabled={verifyingId === payment._id}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50 font-medium text-sm"
                          >
                            {verifyingId === payment._id ? 'Verifying...' : 'Verify Payment'}
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment)}
                            disabled={verifyingId === payment._id}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 font-medium text-sm"
                          >
                            {verifyingId === payment._id ? 'Rejecting...' : 'Reject Payment'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verify Payment Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-green-500 text-white p-6">
              <h2 className="text-2xl font-bold">Verify Payment</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Buyer:</span> {selectedPayment.buyerId.firstName} {selectedPayment.buyerId.lastName}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-bold">Amount:</span> ₹{selectedPayment.totalAmount}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-bold">Crop:</span> {selectedPayment.cropId.name} ({selectedPayment.quantity.amount} {selectedPayment.quantity.unit})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  placeholder="Add any verification notes..."
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPayment}
                  disabled={verifyingId === selectedPayment._id}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50 font-medium"
                >
                  {verifyingId === selectedPayment._id ? 'Verifying...' : 'Verify Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default SellerPaymentVerification
