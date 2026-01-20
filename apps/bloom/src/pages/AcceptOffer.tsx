import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

interface OfferDetails {
  firstName: string;
  lastName: string;
  email: string;
  contractUrl: string;
  offerSentAt: string;
  offerAcceptedAt: string | null;
  isAccepted: boolean;
  signedContractUrl: string | null;
}

export default function AcceptOffer() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signedContractUploaded, setSignedContractUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffer() {
      if (!token) {
        setError('Invalid offer link');
        setLoading(false);
        return;
      }

      try {
        console.log('≡ƒöì Fetching offer with token:', token);
        const url = API_ENDPOINTS.acceptOffer(token);
        console.log('≡ƒöì Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('≡ƒöì Response status:', response.status);
        
        const data = await response.json();
        console.log('≡ƒöì Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load offer');
        }

        setOffer(data);
        if (data.isAccepted) {
          setAccepted(true);
        }
        if (data.signedContractUrl) {
          setSignedContractUploaded(true);
        }
      } catch (err) {
        console.error('≡ƒö┤ Error loading offer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load offer');
      } finally {
        setLoading(false);
      }
    }

    fetchOffer();
  }, [token]);

  const handleUploadSignedContract = async (file: File) => {
    if (!token) return;

    setUploading(true);
    setError(null);
    
    try {
      console.log('≡ƒôñ Starting contract upload:', file.name);
      
      // Create FormData to upload the file
      const formData = new FormData();
      formData.append('file', file);

      const uploadUrl = API_ENDPOINTS.acceptOffer(token) + '/signed-contract';
      console.log('≡ƒôñ Upload URL:', uploadUrl);

      // Upload directly to the signed contract endpoint
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('≡ƒôñ Upload response status:', uploadResponse.status);
      const data = await uploadResponse.json();
      console.log('≡ƒôñ Upload response data:', data);

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Failed to upload contract');
      }

      console.log('Γ£à Contract uploaded successfully');
      setSignedContractUploaded(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload contract';
      console.error('≡ƒö┤ Upload error:', errorMsg);
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !signedContractUploaded) return;

    setAccepting(true);
    try {
      console.log('Γ£à Accepting offer for token:', token);
      const response = await fetch(API_ENDPOINTS.acceptOffer(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      console.log('Γ£à Accept response status:', response.status);
      console.log('Γ£à Accept response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept offer');
      }

      setAccepted(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to accept offer';
      console.error('≡ƒö┤ Accept error:', errorMsg);
      setError(errorMsg);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">≡ƒÄë Welcome to Bloom!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Congratulations {offer?.firstName}! You've accepted the offer to join our team.
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-emerald-800 mb-2">What happens next?</h2>
            <ul className="text-sm text-emerald-700 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">Γ£ô</span>
                Our team will review your acceptance
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">Γ£ô</span>
                You'll receive an onboarding email with next steps
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">Γ£ô</span>
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
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">≡ƒî╕ Bloom</h1>
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
                Please download, review, and sign the agreement, then upload your signed copy below.
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
                Download Contract (PDF)
              </a>
            </div>

            {/* Upload Signed Contract Section */}
            <div className={`border rounded-lg p-4 ${signedContractUploaded ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`font-semibold flex items-center gap-2 ${signedContractUploaded ? 'text-green-900' : 'text-blue-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Signed Contract
              </h3>
              {signedContractUploaded ? (
                <div className="mt-3">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Signed contract uploaded successfully!
                  </p>
                  <button
                    onClick={() => {
                      setSignedContractUploaded(false);
                      const fileInput = document.getElementById('signed-contract-upload') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                  >
                    Upload a different file
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-blue-700 mb-4">
                    After signing the contract, upload your signed copy here.
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    id="signed-contract-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadSignedContract(file);
                      e.target.value = '';
                    }}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="signed-contract-upload"
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-colors font-semibold text-lg ${
                      uploading 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploading ? 'ΓÅ│ Uploading...' : '≡ƒôä Upload Signed Contract (PDF)'}
                  </label>
                </div>
              )}
            </div>

            {/* What You're Agreeing To */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">By accepting this offer, you agree to:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">Γ£ô</span>
                  The terms outlined in the Practitioner Agreement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">Γ£ô</span>
                  Completing the onboarding process
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">Γ£ô</span>
                  Upholding the values and standards of Bloom
                </li>
              </ul>
            </div>

            {/* Accept Button */}
            <div className="pt-4">
              {!signedContractUploaded && (
                <p className="text-center text-amber-600 text-sm mb-3">
                  ΓÜá∩╕Å Please upload your signed contract above before accepting
                </p>
              )}
              <button
                onClick={handleAccept}
                disabled={accepting || !signedContractUploaded}
                className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Γ£à Accept Offer & Join Bloom
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
