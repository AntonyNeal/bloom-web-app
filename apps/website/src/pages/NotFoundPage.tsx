import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-900 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-8">Page not found</p>
        <Link
          to="/"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-block"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
