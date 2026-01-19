"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionPageClient } from "./SessionPageClient";

/**
 * Session Page - Entry point for patient video sessions
 * 
 * Uses query parameter ?token=xxx instead of path parameter /session/[token]
 * This works better with static export for Azure Static Web Apps.
 * 
 * URL format: /session?token=abc123
 */
function SessionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Missing Session Link
          </h1>
          
          <p className="text-gray-600 mb-6">
            No session token was provided. Please use the link from your appointment email.
          </p>
          
          <a
            href="https://www.life-psychology.com.au/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }
  
  return <SessionPageClient token={token} />;
}

/**
 * Suspense wrapper for useSearchParams
 */
export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading your session...</p>
          </div>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
