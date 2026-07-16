'use client'

import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

interface PaymentData {
  _id: string
  sellerId: {
    _id: string
    firstName: string
    lastName: string
    email: string
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
  paymentStatus: 'Pending Verification' | 'Verified' | 'Rejected'
  createdAt: string
}

const BuyerPaymentHistory = () => {
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payments/buyer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch payments')

      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      toast.error('Failed to load payment history')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Verification':
        return 'bg-yellow-50 border-yellow-200'
      case 'Verified':
        return 'bg-green-50 border-green-200'
      case 'Rejected':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Verification':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
            <Clock size={16} />
            Pending Verification
          </span>
        )
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <CheckCircle size={16} />
            Verified
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
            <XCircle size={16} />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.paymentStatus === 'Pending Verification').length,
    verified: payments.filter(p => p.paymentStatus === 'Verified').length,
    rejected: payments.filter(p => p.paymentStatus === 'Rejected').length,
    totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0)
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Payment History</h1>
            <p className="text-gray-600 mt-2">Track your online payment submissions</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm">Total Payments</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm">Verified</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.verified}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
          </div>

          {/* Payments List */}
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No payment history yet</p>
              <p className="text-gray-500 text-sm mt-2">Your crop purchases and payments will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map(payment => (
                <div
                  key={payment._id}
                  className={`border rounded-lg p-6 ${getStatusColor(payment.paymentStatus)} cursor-pointer hover:shadow-lg transition`}
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Left Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        {payment.cropId.images?.[0] && (
                          <img
                            src={payment.cropId.images[0].url}
                            alt={payment.cropId.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-800">{payment.cropId.name}</h3>
                          <p className="text-sm text-gray-600">
                            {payment.quantity.amount} {payment.quantity.unit} × ₹{payment.cropId.price}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            From: {payment.sellerId.firstName} {payment.sellerId.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs">Transaction ID</p>
                          <p className="font-mono text-gray-800 font-medium">{payment.transactionId}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Payment App</p>
                          <p className="text-gray-800">{payment.paymentApp}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Amount</p>
                          <p className="text-lg font-bold text-gray-800">₹{payment.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Date</p>
                          <p className="text-gray-800">{new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Status */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(payment.paymentStatus)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <p className="text-green-100 text-sm mt-1">
                {new Date(selectedPayment.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Crop Info */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Crop Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800 ml-2">{selectedPayment.cropId.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium text-gray-800 ml-2">
                      {selectedPayment.quantity.amount} {selectedPayment.quantity.unit}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Price per unit:</span>
                    <span className="font-medium text-gray-800 ml-2">₹{selectedPayment.cropId.price}</span>
                  </p>
                </div>
              </div>

              {/* Seller Info */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Seller Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800 ml-2">
                      {selectedPayment.sellerId.firstName} {selectedPayment.sellerId.lastName}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-800 ml-2 break-all">{selectedPayment.sellerId.email}</span>
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Payment Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono font-medium text-gray-800 ml-2 break-all">{selectedPayment.transactionId}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Payment App:</span>
                    <span className="font-medium text-gray-800 ml-2">{selectedPayment.paymentApp}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-green-600 text-lg ml-2">₹{selectedPayment.totalAmount}</span>
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-800 mb-2">Status</h3>
                {getStatusBadge(selectedPayment.paymentStatus)}
                <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Status Information</p>
                  <p className="text-sm text-gray-800">
                    {selectedPayment.paymentStatus === 'Pending Verification' &&
                      'Your payment is waiting for seller verification. Please wait for confirmation.'}
                    {selectedPayment.paymentStatus === 'Verified' &&
                      'Your payment has been verified by the seller. Your order is confirmed!'}
                    {selectedPayment.paymentStatus === 'Rejected' &&
                      'Your payment has been rejected by the seller. Please contact them for more details.'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition font-medium mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default BuyerPaymentHistory
