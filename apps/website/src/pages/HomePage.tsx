export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary-900 mb-4">
            Life Psychology Australia
          </h1>
          <p className="text-xl text-gray-600">
            Professional Psychological Services
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-semibold text-primary-800 mb-4">
              Welcome
            </h2>
            <p className="text-gray-700 mb-4">
              Life Psychology Australia provides comprehensive psychological services
              to support your mental health and wellbeing.
            </p>
            <p className="text-gray-700">
              Our team of experienced psychologists is dedicated to helping you
              achieve your personal and professional goals.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-3">
                Our Services
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Individual Therapy</li>
                <li>• Family Counseling</li>
                <li>• Corporate Psychology</li>
                <li>• Assessment Services</li>
              </ul>
            </div>

            <div className="bg-primary-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-3">
                Contact Us
              </h3>
              <p className="text-gray-700 mb-2">
                Ready to take the next step?
              </p>
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Book an Appointment
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
