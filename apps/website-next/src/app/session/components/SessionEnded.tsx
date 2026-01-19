"use client";

import { useState } from "react";

interface SessionEndedProps {
  practitionerName: string;
  patientFirstName: string;
}

/**
 * Session Ended Component
 * 
 * Post-call screen with:
 * - Thank you message
 * - Optional feedback
 * - Next steps
 */
export function SessionEnded({ practitionerName, patientFirstName }: SessionEndedProps) {
  const [feedback, setFeedback] = useState<"great" | "okay" | "poor" | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const submitFeedback = async () => {
    // In a real implementation, this would send to the API
    console.log("Feedback submitted:", feedback);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Session Complete
        </h1>
        
        <p className="text-gray-600 mb-8">
          Thank you for your session, {patientFirstName}!
          <br />
          We hope your time with {practitionerName} was helpful.
        </p>

        {/* Quick feedback */}
        {!feedbackSubmitted ? (
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-4">
              How was your experience today?
            </p>
            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={() => setFeedback("great")}
                className={`p-4 rounded-xl transition-all ${
                  feedback === "great"
                    ? "bg-green-100 border-2 border-green-500 scale-110"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                title="Great"
              >
                <span className="text-3xl">😊</span>
              </button>
              <button
                onClick={() => setFeedback("okay")}
                className={`p-4 rounded-xl transition-all ${
                  feedback === "okay"
                    ? "bg-yellow-100 border-2 border-yellow-500 scale-110"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                title="Okay"
              >
                <span className="text-3xl">😐</span>
              </button>
              <button
                onClick={() => setFeedback("poor")}
                className={`p-4 rounded-xl transition-all ${
                  feedback === "poor"
                    ? "bg-red-100 border-2 border-red-500 scale-110"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                title="Could be better"
              >
                <span className="text-3xl">😕</span>
              </button>
            </div>
            {feedback && (
              <button
                onClick={submitFeedback}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Submit Feedback
              </button>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-green-50 rounded-xl p-4">
            <p className="text-green-700">Thank you for your feedback! 💚</p>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
          <h2 className="font-medium text-blue-900 mb-3">What&apos;s Next?</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your session notes will be available in your patient portal
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Your next appointment will be scheduled via email
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Check your email for any follow-up resources
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="https://www.life-psychology.com.au"
            className="block w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Visit Our Website
          </a>
          
          <a
            href="https://www.life-psychology.com.au/contact"
            className="block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Contact Us
          </a>
        </div>

        {/* Emergency notice */}
        <div className="mt-8 p-4 bg-red-50 rounded-xl text-left">
          <p className="text-xs text-red-700">
            <strong>Need urgent support?</strong> If you&apos;re in crisis, please contact Lifeline on <strong>13 11 14</strong> or call <strong>000</strong> in an emergency.
          </p>
        </div>
      </div>
    </div>
  );
}
