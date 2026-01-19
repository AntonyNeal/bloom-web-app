"use client";

import { useState, useRef, useEffect } from "react";
import type { SessionData } from "../SessionClient";

interface WaitingRoomProps {
  session: SessionData;
  consentGiven: boolean;
  isJoining: boolean;
  error: string | null;
  onConsentChange: (consent: boolean) => Promise<boolean>;
  onJoinCall: () => void;
}

/**
 * Waiting Room Component
 * 
 * Pre-call experience where patients:
 * 1. See session info
 * 2. Test camera/microphone
 * 3. Give consent to recording
 * 4. Join the call
 */
export function WaitingRoom({
  session,
  consentGiven,
  isJoining,
  error,
  onConsentChange,
  onJoinCall,
}: WaitingRoomProps) {
  const [localConsentChecked, setLocalConsentChecked] = useState(consentGiven);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [deviceTestStatus, setDeviceTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  /**
   * Test camera and microphone
   */
  const testDevices = async () => {
    setDeviceTestStatus("testing");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setCameraStream(stream);
      setDeviceTestStatus("success");
    } catch (err) {
      console.error("Device test failed:", err);
      setDeviceTestStatus("error");
    }
  };

  /**
   * Handle consent checkbox change
   */
  const handleConsentChange = async (checked: boolean) => {
    setLocalConsentChecked(checked);
    
    if (checked && !consentGiven) {
      setIsSubmittingConsent(true);
      await onConsentChange(true);
      setIsSubmittingConsent(false);
    }
  };

  const appointmentDate = new Date(session.appointmentTime);
  const canJoin = localConsentChecked && deviceTestStatus === "success" && !isJoining;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl">🌻</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome, {session.patientFirstName}!
          </h1>
          <p className="text-gray-600">
            Your session with {session.practitionerName}
          </p>
        </div>

        {/* Session Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                Scheduled for
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {appointmentDate.toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="text-gray-600">
                {appointmentDate.toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })} ({session.durationMinutes} minutes)
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              session.status === "active" 
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {session.status === "active" ? "In Progress" : "Ready to Join"}
            </div>
          </div>
        </div>

        {/* Device Test */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 1: Test Your Camera & Microphone
          </h2>
          
          {deviceTestStatus === "idle" && (
            <button
              onClick={testDevices}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Test Camera & Microphone
            </button>
          )}
          
          {deviceTestStatus === "testing" && (
            <div className="text-center py-4">
              <div className="w-8 h-8 mx-auto mb-2 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Requesting access...</p>
            </div>
          )}
          
          {deviceTestStatus === "success" && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    <span className="w-2 h-2 mr-1 bg-white rounded-full animate-pulse"></span>
                    Camera OK
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    <span className="w-2 h-2 mr-1 bg-white rounded-full animate-pulse"></span>
                    Microphone OK
                  </span>
                </div>
              </div>
              <button
                onClick={testDevices}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Test again
              </button>
            </div>
          )}
          
          {deviceTestStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-red-800">Camera or microphone access denied</p>
                  <p className="text-sm text-red-600 mt-1">
                    Please allow access to your camera and microphone in your browser settings and try again.
                  </p>
                  <button
                    onClick={testDevices}
                    className="mt-3 text-sm text-red-700 hover:text-red-800 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Consent */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 2: Recording Consent
          </h2>
          
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800">
              Your session may be recorded for clinical documentation purposes. 
              Recordings are securely stored and only accessible to your treating clinician.
            </p>
          </div>
          
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={localConsentChecked}
              onChange={(e) => handleConsentChange(e.target.checked)}
              disabled={isSubmittingConsent}
              className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">
              I understand and consent to the potential recording of this session for clinical documentation purposes.
            </span>
          </label>
          
          {isSubmittingConsent && (
            <p className="mt-2 text-sm text-gray-500">Saving consent...</p>
          )}
        </div>

        {/* Join Button */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 3: Join Your Session
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <button
            onClick={onJoinCall}
            disabled={!canJoin}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              canJoin
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isJoining ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining Session...
              </span>
            ) : (
              "Join Session"
            )}
          </button>
          
          {!canJoin && !isJoining && (
            <p className="mt-3 text-center text-sm text-gray-500">
              {deviceTestStatus !== "success" 
                ? "Please test your camera and microphone first"
                : "Please give consent to join the session"}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Having trouble?{" "}
            <a href="https://www.life-psychology.com.au/contact" className="text-blue-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
