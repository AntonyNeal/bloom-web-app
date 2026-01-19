import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HalaxyClinicianModal } from './HalaxyClinicianModal';

interface HalaxyClinicianSetupProps {
  applicationId: number;
  clinicianName: string;
  clinicianEmail: string;
  isVerified: boolean;
  isVerifying: boolean;
  onVerify: (applicationId: number) => Promise<void>;
  verifiedAt?: string;
  practitionerId?: string;
}

export function HalaxyClinicianSetup({
  applicationId,
  clinicianName,
  clinicianEmail,
  isVerified,
  isVerifying,
  onVerify,
  verifiedAt,
  practitionerId,
}: HalaxyClinicianSetupProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerify = async () => {
    try {
      await onVerify(applicationId);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <>
      <div className={`p-4 rounded-lg border-2 ${
        isVerified
          ? 'bg-green-50 border-green-300'
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-1">
            {isVerified ? '✅' : '⚠️'}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">
              {isVerified
                ? 'Clinician Verified in Halaxy'
                : 'Create Clinician in Halaxy'}
            </h3>
            {isVerified ? (
              <div>
                <p className="text-sm text-green-800 mb-1">
                  ✓ Clinician record found in Halaxy
                </p>
                {verifiedAt && (
                  <p className="text-xs text-green-700">
                    Verified: {new Date(verifiedAt).toLocaleString()}
                  </p>
                )}
                {practitionerId && (
                  <p className="text-xs text-green-700">
                    Practitioner ID: {practitionerId}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-amber-800 mb-3">
                  Before sending the onboarding invite, you must:
                </p>
                <ol className="text-sm text-amber-900 space-y-1 mb-3 ml-4 list-decimal">
                  <li>Log into Halaxy admin portal</li>
                  <li>Create a new clinician record</li>
                  <li>Use the name and email below</li>
                  <li>Return here and verify the record was created</li>
                </ol>

                {/* Clinician Details Box */}
                <div className="bg-white border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-600 font-medium mb-2">Clinician Details:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-mono font-semibold text-gray-900">{clinicianName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-mono font-semibold text-gray-900">{clinicianEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    📖 View Step-by-Step Instructions
                  </Button>
                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    {isVerifying ? '🔄 Verifying...' : '🔍 Verify Clinician in Halaxy'}
                  </Button>
                </div>

                <p className="text-xs text-amber-700 mt-2 text-center">
                  After you've created the clinician record in Halaxy, click "Verify Clinician" above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for step-by-step instructions */}
      <HalaxyClinicianModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clinicianName={clinicianName}
        clinicianEmail={clinicianEmail}
      />
    </>
  );
}
