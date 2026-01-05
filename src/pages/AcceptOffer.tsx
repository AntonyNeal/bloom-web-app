import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface OfferDetails {
  firstName: string;
  lastName: string;
  email: string;
  contractUrl: string;
  offerSentAt: string;
  offerAcceptedAt: string | null;
  isAccepted: boolean;
}

export default function AcceptOffer() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API URL set by CI/CD per environment
  const API_BASE = import.meta.env.VITE_AZURE_FUNCTIONS_URL || import.meta.env.VITE_API_URL?.replace('/api', '');

  useEffect(() => {
    async function fetchOffer() {
      if (!token) {
        setError('Invalid offer link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/accept-offer/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load offer');
        }

        setOffer(data);
        if (data.isAccepted) {
          setAccepted(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load offer');
      } finally {
        setLoading(false);
      }
    }

    fetchOffer();
  }, [token, API_BASE]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const response = await fetch(`${API_BASE}/api/accept-offer/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept offer');
      }

      setAccepted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your offer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact{' '}
            <a href="mailto:admin@life-psychology.com.au" className="text-emerald-600 hover:underline">
              admin@life-psychology.com.au
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Welcome to Bloom!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Congratulations {offer?.firstName}! You've accepted the offer to join our team.
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-emerald-800 mb-2">What happens next?</h2>
            <ul className="text-sm text-emerald-700 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                Our team will review your acceptance
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                You'll receive an onboarding email within 24-48 hours
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                Complete onboarding to set up your practitioner profile
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Questions? Email us at{' '}
            <a href="mailto:admin@life-psychology.com.au" className="text-emerald-600 hover:underline">
              admin@life-psychology.com.au
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">🌸 Bloom</h1>
          <p className="text-gray-600">Life Psychology Australia</p>
        </div>

        {/* Offer Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-emerald-600 text-white p-6">
            <h2 className="text-2xl font-bold">You've Received an Offer!</h2>
            <p className="text-emerald-100 mt-1">
              Congratulations, {offer?.firstName}! We'd love to have you join our team.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Contract Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Practitioner Agreement
              </h3>
              <p className="text-sm text-amber-700 mt-2 mb-3">
                Please review your practitioner agreement carefully before accepting.
              </p>
              <a
                href={offer?.contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Contract (PDF)
              </a>
            </div>

            {/* What You're Agreeing To */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">By accepting this offer, you agree to:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  The terms outlined in the Practitioner Agreement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Completing the onboarding process
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Upholding the values and standards of Bloom
                </li>
              </ul>
            </div>

            {/* Accept Button */}
            <div className="pt-4">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    ✅ Accept Offer & Join Bloom
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                By clicking accept, you confirm you have read and agree to the practitioner agreement.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            Have questions?{' '}
            <a href="mailto:admin@life-psychology.com.au" className="text-emerald-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
