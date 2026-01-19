"use client";

import { useState, useCallback } from "react";
import { WaitingRoom } from "./components/WaitingRoom";
import { VideoCall } from "./components/VideoCall";
import { SessionEnded } from "./components/SessionEnded";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://bloom-functions-dev.azurewebsites.net/api";

export interface SessionData {
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

interface CallCredentials {
  token: string;
  userId: string;
  endpoint: string;
  roomId: string;
  acsRoomId: string;
}

type SessionPhase = "waiting" | "joining" | "in-call" | "ended" | "error";

interface SessionClientProps {
  token: string;
  session: SessionData;
}

/**
 * Client-side session manager
 * Handles consent, joining call, and session state
 */
export function SessionClient({ token, session }: SessionClientProps) {
  // Suppress unused variable warning - token may be used for future features
  void token;
  
  const [phase, setPhase] = useState<SessionPhase>(
    session.status === "active" && session.consentStatus === "consented" 
      ? "joining" 
      : "waiting"
  );
  const [consentGiven, setConsentGiven] = useState(session.consentStatus === "consented");
  const [callCredentials, setCallCredentials] = useState<CallCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit recording consent
   */
  const submitConsent = useCallback(async (consent: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/session/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: session.appointmentId,
          patientId: session.patientId,
          consentGiven: consent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit consent");
      }

      setConsentGiven(consent);
      return true;
    } catch (err) {
      console.error("Consent error:", err);
      setError("Failed to submit consent. Please try again.");
      return false;
    }
  }, [session.appointmentId, session.patientId]);

  /**
   * Join the video call
   */
  const joinCall = useCallback(async () => {
    setPhase("joining");
    setError(null);

    try {
      // Join the room and get ACS credentials
      const response = await fetch(`${API_BASE}/telehealth/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: session.appointmentId,
          participantType: "patient",
          participantId: session.patientId,
          participantName: session.patientFirstName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join session");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to join session");
      }

      setCallCredentials({
        token: data.data.token,
        userId: data.data.userId,
        endpoint: data.data.endpoint,
        roomId: data.data.roomId,
        acsRoomId: data.data.acsRoomId,
      });
      
      setPhase("in-call");
    } catch (err) {
      console.error("Join error:", err);
      setError(err instanceof Error ? err.message : "Failed to join session");
      setPhase("waiting");
    }
  }, [session.appointmentId, session.patientId, session.patientFirstName]);

  /**
   * Handle call ending
   */
  const handleCallEnded = useCallback(() => {
    setPhase("ended");
    setCallCredentials(null);
  }, []);

  // Render based on phase
  if (phase === "ended") {
    return (
      <SessionEnded
        practitionerName={session.practitionerName}
        patientFirstName={session.patientFirstName}
      />
    );
  }

  if (phase === "in-call" && callCredentials) {
    return (
      <VideoCall
        credentials={callCredentials}
        patientName={session.patientFirstName}
        practitionerName={session.practitionerName}
        appointmentTime={session.appointmentTime}
        durationMinutes={session.durationMinutes}
        onCallEnded={handleCallEnded}
      />
    );
  }

  // Waiting room (including "joining" state for loading)
  return (
    <WaitingRoom
      session={session}
      consentGiven={consentGiven}
      isJoining={phase === "joining"}
      error={error}
      onConsentChange={submitConsent}
      onJoinCall={joinCall}
    />
  );
}
