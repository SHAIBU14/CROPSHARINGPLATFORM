import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">A brief privacy notice for this demo build.</p>
        </div>

        <div className="space-y-4 text-gray-700">
          <p>The app stores account and demo content needed to run the platform locally.</p>
          <p>Only data you enter into the app is used for the app experience. No additional analytics or external tracking has been added in this project cleanup.</p>
          <p>If you want to remove local demo data later, it can be cleared from the server demo storage files.</p>
        </div>

        <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center">
          Back to login
        </Link>
      </div>
    </div>
  )
}
