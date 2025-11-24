import React from 'react';

interface Step {
  number: number;
  title: string;
  completed: boolean;
}

interface FormProgressProps {
  steps: Step[];
  currentStep: number;
}

// Colorful gradient backgrounds for each step
const stepColors = [
  'from-blue-500 to-indigo-600', // Step 1 - Qualification
  'from-purple-500 to-pink-600', // Step 2 - Personal Info
  'from-orange-500 to-red-600', // Step 3 - Experience
  'from-teal-500 to-cyan-600', // Step 4 - Telehealth
  'from-green-500 to-emerald-600', // Step 5 - Insurance
  'from-yellow-500 to-orange-600', // Step 6 - References
  'from-rose-500 to-pink-600', // Step 7 - Documents
];

export const FormProgress: React.FC<FormProgressProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Step Circle with gradient */}
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-all duration-300 ${
                  step.completed
                    ? `bg-gradient-to-br ${stepColors[index]} scale-100`
                    : step.number === currentStep
                      ? `bg-gradient-to-br ${stepColors[index]} scale-110 ring-4 ring-blue-200 animate-pulse`
                      : 'bg-gray-300 text-gray-500 scale-90'
                }`}
              >
                {step.completed ? (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-lg">{step.number}</span>
                )}
              </div>

              {/* Step Title with color indicator */}
              <div
                className={`text-sm mt-3 font-semibold text-center max-w-24 transition-colors duration-300 ${
                  step.number === currentStep
                    ? 'text-blue-700'
                    : step.completed
                      ? 'text-gray-700'
                      : 'text-gray-400'
                }`}
              >
                {step.title}
              </div>
            </div>

            {/* Progress Line with gradient (not after last step) */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-2 mx-4 min-w-12 rounded-full overflow-hidden bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    step.completed
                      ? `bg-gradient-to-r ${stepColors[index]} w-full`
                      : 'w-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
