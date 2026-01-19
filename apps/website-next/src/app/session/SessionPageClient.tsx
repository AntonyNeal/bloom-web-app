"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionClient } from "./SessionClient";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://bloom-functions-dev.azurewebsites.net/api";

interface SessionData {
  appointmentId: string;
  patientId: string;
  patientFirstName: string;
  practitionerName: string;
  appointmentTime: string;
  durationMinutes: number;
  status: "early" | "ready" | "active" | "ended";
  consentStatus: "pending" | "consented" | "declined";
  roomId: string | null;
  canJoin: boolean;
  message: string | null;
}

interface ValidationResult {
  success: boolean;
  error?: string;
  code?: string;
  data?: SessionData;
}

interface SessionPageClientProps {
  token: string;
}

/**
 * Client-side session page that handles token validation
 * and renders the appropriate state
 */
export function SessionPageClient({ token }: SessionPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const validateToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/session/token/validate/${token}`);
      const data = await response.json();
      setValidation(data);
    } catch (error) {
      console.error("Token validation error:", error);
      setValidation({
        success: false,
        error: "Unable to validate session. Please try again.",
        code: "NETWORK_ERROR",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Auto-refresh for "early" status
  useEffect(() => {
    if (validation?.data?.status === "early") {
      const timer = setInterval(() => {
        validateToken();
      }, 60000); // Check every minute

      return () => clearInterval(timer);
    }
  }, [validation?.data?.status, validateToken]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Invalid token states
  if (!validation?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            {validation?.code === "TOKEN_EXPIRED" 
              ? "Session Link Expired" 
              : validation?.code === "TOKEN_NOT_FOUND"
              ? "Session Not Found"
              : "Invalid Session Link"}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {validation?.code === "TOKEN_EXPIRED"
              ? "This session link has expired. If you need to reschedule, please contact us."
              : validation?.code === "NETWORK_ERROR"
              ? "We couldn't connect to the server. Please check your internet connection and try again."
              : "This session link is not valid. Please check your email for the correct link."}
          </p>
          
          {validation?.code === "NETWORK_ERROR" && (
            <button
              onClick={() => {
                setLoading(true);
                validateToken();
              }}
              className="mb-4 inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mr-3"
            >
              Try Again
            </button>
          )}
          
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

  const session = validation.data!;

  // "Too early" state
  if (session.status === "early") {
    const appointmentDate = new Date(session.appointmentTime);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Bloom Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🌻</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Hi {session.patientFirstName}!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your session with {session.practitionerName} isn&apos;t quite ready yet.
          </p>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-blue-600 uppercase tracking-wide font-medium mb-1">
              Your appointment
            </p>
            <p className="text-2xl font-semibold text-blue-900">
              {appointmentDate.toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="text-xl text-blue-800">
              {appointmentDate.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking every minute...
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Please return about 5 minutes before your session starts.
          </p>
        </div>
      </div>
    );
  }

  // "Ended" state
  if (session.status === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Session Complete
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your session with {session.practitionerName}.
            We hope it was helpful!
          </p>
          
          <a
            href="https://www.life-psychology.com.au"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Visit Our Website
          </a>
        </div>
      </div>
    );
  }

  // Ready or Active - render the session client
  return (
    <SessionClient
      token={token}
      session={session}
    />
  );
}
