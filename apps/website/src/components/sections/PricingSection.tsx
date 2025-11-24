import { Link } from 'react-router-dom';

const PricingSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-200 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-indigo-200 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Transparent Pricing
          </h2>
          <p className="text-xl text-slate-800 max-w-2xl mx-auto mb-8">
            Clear, upfront pricing with flexible funding options
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/60 p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              $233-$300
            </div>
            <div className="text-lg text-slate-700">per 60-minute session</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Service Pricing
              </h3>
              <ul className="text-slate-700 space-y-2">
                <li>• Individual therapy: $250</li>
                <li>• Couples therapy: $300</li>
                <li>• NDIS sessions: $233</li>
                <li>• Medicare sessions: $250 (with rebate)</li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                What's Included
              </h3>
              <ul className="text-slate-700 space-y-2">
                <li>• 60-minute therapy session</li>
                <li>• Secure telehealth platform</li>
                <li>• Professional email support</li>
                <li>• Flexible appointment times</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-700 mb-6">
              All sessions are conducted via secure telehealth. Medicare and
              private health rebates may apply.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Fees & Funding Details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
