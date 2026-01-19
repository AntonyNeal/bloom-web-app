"use client";

import { useEffect, useState, useRef } from "react";

interface CallCredentials {
  token: string;
  userId: string;
  endpoint: string;
  roomId: string;
  acsRoomId: string;
}

interface VideoCallProps {
  credentials: CallCredentials;
  patientName: string;
  practitionerName: string;
  appointmentTime: string;
  durationMinutes: number;
  onCallEnded: () => void;
}

/**
 * Video Call Component
 * 
 * Handles the actual ACS video call:
 * - Connects to the room
 * - Manages local and remote video streams
 * - Audio/video controls
 * - Session timer
 * 
 * Uses dynamic imports to avoid SSR issues with browser-only APIs
 */
export function VideoCall({
  credentials,
  patientName,
  practitionerName,
  appointmentTime,
  durationMinutes,
  onCallEnded,
}: VideoCallProps) {
  // Suppress unused variable warnings
  void appointmentTime;
  
  const [callState, setCallState] = useState<"loading" | "connecting" | "connected" | "disconnected">("loading");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);

  // Refs for ACS objects - using any to avoid type complexity with dynamic imports
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callClientRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callAgentRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localVideoStreamRef = useRef<any>(null);
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Format elapsed time as MM:SS
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Initialize call with dynamic imports
   */
  useEffect(() => {
    let mounted = true;

    const initCall = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const callingModule = await import("@azure/communication-calling");
        const commonModule = await import("@azure/communication-common");
        
        const { CallClient, LocalVideoStream, VideoStreamRenderer } = callingModule;
        const { AzureCommunicationTokenCredential } = commonModule;

        if (!mounted) return;
        
        setCallState("connecting");

        // Create call client
        const callClient = new CallClient();
        callClientRef.current = callClient;

        // Create token credential
        const tokenCredential = new AzureCommunicationTokenCredential(credentials.token);

        // Create call agent
        const callAgent = await callClient.createCallAgent(tokenCredential, {
          displayName: patientName,
        });
        callAgentRef.current = callAgent;

        // Get devices
        const deviceManager = await callClient.getDeviceManager();
        await deviceManager.askDevicePermission({ video: true, audio: true });

        // Get camera
        const cameras = await deviceManager.getCameras();
        if (cameras.length > 0) {
          localVideoStreamRef.current = new LocalVideoStream(cameras[0]);
        }

        // Join the room call
        const locator = { roomId: credentials.acsRoomId };
        const call = callAgent.join(locator, {
          videoOptions: localVideoStreamRef.current 
            ? { localVideoStreams: [localVideoStreamRef.current] }
            : undefined,
          audioOptions: { muted: false },
        });
        callRef.current = call;

        // Subscribe to call state changes
        call.on("stateChanged", () => {
          if (!mounted) return;
          
          if (call.state === "Connected") {
            setCallState("connected");
            // Start timer
            timerRef.current = setInterval(() => {
              setElapsedTime(prev => prev + 1);
            }, 1000);
          } else if (call.state === "Disconnected") {
            setCallState("disconnected");
            onCallEnded();
          }
        });

        // Handle remote participant video
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRemoteVideo = async (participant: any) => {
          if (!remoteVideoContainerRef.current) return;
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          participant.on("videoStreamsUpdated", async (e: any) => {
            for (const stream of e.added) {
              if (stream.isAvailable && remoteVideoContainerRef.current) {
                const renderer = new VideoStreamRenderer(stream);
                const view = await renderer.createView();
                // Clear previous content
                remoteVideoContainerRef.current.innerHTML = '';
                remoteVideoContainerRef.current.appendChild(view.target);
              }
            }
          });

          // Check existing streams
          for (const stream of participant.videoStreams) {
            if (stream.isAvailable && remoteVideoContainerRef.current) {
              const renderer = new VideoStreamRenderer(stream);
              const view = await renderer.createView();
              remoteVideoContainerRef.current.innerHTML = '';
              remoteVideoContainerRef.current.appendChild(view.target);
            }
          }
        };

        // Subscribe to remote participants
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.on("remoteParticipantsUpdated", (e: any) => {
          for (const participant of e.added) {
            setHasRemoteParticipant(true);
            handleRemoteVideo(participant);
          }
          if (e.removed.length > 0 && call.remoteParticipants.length === 0) {
            setHasRemoteParticipant(false);
          }
        });

        // Check existing remote participants
        for (const participant of call.remoteParticipants) {
          setHasRemoteParticipant(true);
          handleRemoteVideo(participant);
        }

        // Render local video
        if (localVideoStreamRef.current && localVideoContainerRef.current) {
          const renderer = new VideoStreamRenderer(localVideoStreamRef.current);
          const view = await renderer.createView({ scalingMode: "Crop" });
          localVideoContainerRef.current.appendChild(view.target);
        }

      } catch (err) {
        console.error("Call initialization error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to connect to call");
        }
      }
    };

    initCall();

    return () => {
      mounted = false;
      
      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Hang up call
      if (callRef.current) {
        try {
          callRef.current.hangUp();
        } catch (e) {
          console.error("Error hanging up:", e);
        }
      }
      
      // Dispose call agent
      if (callAgentRef.current) {
        try {
          callAgentRef.current.dispose();
        } catch (e) {
          console.error("Error disposing call agent:", e);
        }
      }
    };
  }, [credentials, patientName, onCallEnded]);

  /**
   * Toggle microphone
   */
  const toggleMute = async () => {
    if (!callRef.current) return;
    
    try {
      if (isMuted) {
        await callRef.current.unmute();
      } else {
        await callRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch (err) {
      console.error("Mute toggle error:", err);
    }
  };

  /**
   * Toggle camera
   */
  const toggleCamera = async () => {
    if (!callRef.current || !localVideoStreamRef.current) return;
    
    try {
      if (isCameraOff) {
        await callRef.current.startVideo(localVideoStreamRef.current);
      } else {
        await callRef.current.stopVideo(localVideoStreamRef.current);
      }
      setIsCameraOff(!isCameraOff);
    } catch (err) {
      console.error("Camera toggle error:", err);
    }
  };

  /**
   * End the call
   */
  const endCall = async () => {
    if (callRef.current) {
      try {
        await callRef.current.hangUp();
      } catch (e) {
        console.error("Error ending call:", e);
      }
    }
    onCallEnded();
  };

  // Warning when approaching end time
  const remainingMinutes = durationMinutes - Math.floor(elapsedTime / 60);
  const showTimeWarning = remainingMinutes <= 5 && remainingMinutes > 0;

  // Loading state
  if (callState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p className="text-white text-lg">Loading video call...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onCallEnded}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Waiting Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Remote video (full screen) */}
        <div 
          ref={remoteVideoContainerRef}
          className="absolute inset-0 bg-gray-800 [&>div]:w-full [&>div]:h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
        >
          {callState === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <p className="text-white text-lg">Connecting to {practitionerName}...</p>
              </div>
            </div>
          )}
          
          {callState === "connected" && !hasRemoteParticipant && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-white text-lg">Waiting for {practitionerName} to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div 
          ref={localVideoContainerRef}
          className={`absolute bottom-24 right-4 w-40 h-32 sm:w-48 sm:h-36 bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 [&>div]:w-full [&>div]:h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
            isCameraOff ? "hidden" : ""
          }`}
        />

        {/* Session timer */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <p className="text-sm opacity-70">Session Duration</p>
          <p className={`text-xl font-mono ${showTimeWarning ? "text-yellow-400" : ""}`}>
            {formatTime(elapsedTime)}
          </p>
        </div>

        {/* Time warning */}
        {showTimeWarning && (
          <div className="absolute top-4 right-4 bg-yellow-500 rounded-lg px-4 py-2 text-black">
            <p className="font-medium">⏱ {remainingMinutes} minutes remaining</p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Camera toggle */}
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-colors ${
              isCameraOff 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isCameraOff ? "Turn on camera" : "Turn off camera"}
          >
            {isCameraOff ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* End call button */}
          <button
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            title="End call"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
