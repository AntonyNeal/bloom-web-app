import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HalaxyClinicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianName: string;
  clinicianEmail: string;
}

export function HalaxyClinicianModal({ isOpen, onClose, clinicianName, clinicianEmail }: HalaxyClinicianModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Access Halaxy Admin Portal',
      description: 'Log in to your Halaxy admin dashboard account',
      instructions: [
        'Navigate to the Halaxy admin portal',
        'Log in with your admin credentials',
        'Ensure you have clinician management permissions'
      ]
    },
    {
      title: 'Navigate to Clinician Management',
      description: 'Find the clinician management section',
      instructions: [
        'Go to Settings or Administration menu',
        'Find "Clinicians" or "Practitioners" section',
        'Look for "Add New Clinician" or "+" button'
      ]
    },
    {
      title: 'Create New Clinician Record',
      description: 'Add the new clinician with required details',
      instructions: [
        'Click "Add New Clinician" or similar button',
        'Fill in the clinician\'s information',
        'Ensure you enter the correct email address'
      ]
    },
    {
      title: 'Enter Clinician Details',
      description: `Use the information below to create the record`,
      instructions: [
        `Name: ${clinicianName}`,
        `Email: ${clinicianEmail}`,
        'Complete all required fields in Halaxy',
        'Save the clinician record'
      ],
      isHighlight: true
    },
    {
      title: 'Verify and Complete',
      description: 'Confirm the clinician was added successfully',
      instructions: [
        'You should see the new clinician in the list',
        'Note the clinician ID if required',
        'Return here and click "Verify Practitioner" button'
      ]
    }
  ];

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-xl">
                ⚙️ Create Clinician in Halaxy
              </CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {steps.length}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step Content */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {step.description}
            </p>

            {/* Instructions */}
            <div className={`${
              step.isHighlight 
                ? 'bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4' 
                : 'bg-gray-50 border border-gray-200 rounded-lg p-4'
            }`}>
              <ul className="space-y-2">
                {step.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      step.isHighlight
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-sm pt-0.5 ${
                      step.isHighlight
                        ? 'text-emerald-900 font-medium'
                        : 'text-gray-700'
                    }`}>
                      {instruction}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Highlighted Info Box for Step 4 */}
            {currentStep === 3 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  📋 Clinician Information to Enter:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-mono font-semibold text-blue-900">{clinicianName}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-mono font-semibold text-blue-900">{clinicianEmail}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between">
            <Button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              variant="outline"
              disabled={isFirstStep}
              className="px-6"
            >
              ← Previous
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6"
              >
                Close
              </Button>
              {!isLastStep ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6"
                >
                  ✓ Got it
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
