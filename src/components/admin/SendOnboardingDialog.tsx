import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface SendOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  application: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function SendOnboardingDialog({ isOpen, onClose, onSuccess, application }: SendOnboardingDialogProps) {
  const [halaxyPractitionerId, setHalaxyPractitionerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingLink, setOnboardingLink] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/send-onboarding/${application.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ halaxyPractitionerId: halaxyPractitionerId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send onboarding');
      }

      setOnboardingLink(data.onboardingLink);
      setSuccess(true);
      // Call onSuccess after a short delay to show success message
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setHalaxyPractitionerId('');
      setError('');
      setOnboardingLink('');
      setSuccess(false);
      onClose();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(onboardingLink);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Onboarding Email</DialogTitle>
          <DialogDescription>
            Create practitioner profile for {application.first_name} {application.last_name}
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Step 1:</strong> Create the practitioner account in Halaxy first
                <ol className="ml-4 mt-2 space-y-1 list-decimal text-xs">
                  <li>Log into your Halaxy admin portal</li>
                  <li>Navigate to Settings → Practitioners</li>
                  <li>Add new practitioner with their details</li>
                  <li>Copy the Practitioner ID (format: PR-12345)</li>
                </ol>
                <a 
                  href="https://halaxy.com/a/pr/30431881/profile/practice/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mt-2"
                >
                  Open Halaxy Admin <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="halaxyId">
                Halaxy Practitioner ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="halaxyId"
                placeholder="PR-12345 or 12345"
                value={halaxyPractitionerId}
                onChange={(e) => setHalaxyPractitionerId(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500">
                Enter the Practitioner ID from Halaxy (e.g., PR-1439411 or just the numeric part)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !halaxyPractitionerId.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Send Onboarding
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                ✅ Practitioner profile created successfully!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Onboarding Link</Label>
              <div className="flex gap-2">
                <Input
                  value={onboardingLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" onClick={copyToClipboard}>
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                This link will be sent to {application.email} via email
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
