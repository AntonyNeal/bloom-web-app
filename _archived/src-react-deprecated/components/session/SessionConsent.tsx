/**
 * Session Recording Consent Component
 * 
 * Displayed to patients in the therapy room interface.
 * Patient must consent before recording can begin.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface SessionConsentProps {
  appointmentId: string;
  patientId?: string;
  patientFirstName?: string;
  practitionerName?: string;
  /** Called when consent is given (true) or declined (false) */
  onConsentComplete?: (consented: boolean) => void;
  /** Legacy: Called when consent is given */
  onConsentGiven?: () => void;
  /** Legacy: Called when consent is declined */
  onConsentDeclined?: () => void;
}

export function SessionConsent({
  appointmentId,
  patientId,
  patientFirstName,
  practitionerName,
  onConsentComplete,
  onConsentGiven,
  onConsentDeclined,
}: SessionConsentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  const submitConsent = async (consent: boolean) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/session/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          patientId,
          consentGiven: consent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit consent');
      }

      setConsentGiven(consent);
      setHasResponded(true);
      
      // Call the appropriate callback
      onConsentComplete?.(consent);
      if (consent) {
        onConsentGiven?.();
      } else {
        onConsentDeclined?.();
      }
    } catch (error) {
      console.error('Error submitting consent:', error);
      // Still update UI - consent will be re-checked before recording
      setConsentGiven(consent);
      setHasResponded(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show confirmation after response
  if (hasResponded) {
    return (
      <Card className="max-w-md mx-auto bg-white/90 backdrop-blur shadow-lg">
        <CardContent className="p-6 text-center">
          {consentGiven ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Mic className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Thank you
              </h3>
              <p className="text-gray-600 text-sm">
                Recording is enabled for this session.
                You can ask your therapist to stop at any time.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MicOff className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No problem
              </h3>
              <p className="text-gray-600 text-sm">
                No recording will happen during this session.
                Your therapist will take notes manually.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show consent prompt
  return (
    <Card className="max-w-md mx-auto bg-white/90 backdrop-blur shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bloom-peach/30 flex items-center justify-center">
            <Mic className="w-8 h-8 text-bloom-pink" />
          </div>
          
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            {patientFirstName ? `Hi ${patientFirstName}` : 'Welcome'} 🌸
          </h2>
          
          {practitionerName && (
            <p className="text-gray-500 text-sm mb-3">
              Session with {practitionerName}
            </p>
          )}
          
          <p className="text-gray-700">
            May we record audio during today's session to help with clinical notes?
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
          <div className="flex items-start gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Audio is used only for note-taking</span>
          </div>
          <div className="flex items-start gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Deleted immediately after transcription</span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>You can stop recording at any time</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => submitConsent(false)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1"
          >
            <MicOff className="w-4 h-4 mr-2" />
            No thanks
          </Button>
          
          <Button
            onClick={() => submitConsent(true)}
            disabled={isSubmitting}
            className="flex-1 bg-bloom-pink hover:bg-bloom-pink/90"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Yes, I consent'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SessionConsent;
