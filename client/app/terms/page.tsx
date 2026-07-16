import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Simple usage terms for this demo community garden app.</p>
        </div>

        <div className="space-y-4 text-gray-700">
          <p>Use the app to share gardens, crops, and messages respectfully.</p>
          <p>Do not post misleading listings, harmful content, or private information that you do not have permission to share.</p>
          <p>Demo data may be stored locally for development and testing purposes.</p>
        </div>

        <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center">
          Back to login
        </Link>
      </div>
    </div>
  )
}
