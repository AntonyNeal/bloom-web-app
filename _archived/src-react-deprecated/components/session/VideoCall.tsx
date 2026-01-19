/**
 * VideoCall Component
 * 
 * Azure Communication Services video call interface.
 * Used by both patients and clinicians.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

// ACS SDK types (will be fully typed when package is installed)
/* eslint-disable @typescript-eslint/no-explicit-any */
type CallAgent = any;
type Call = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface VideoCallProps {
  token: string;
  userId: string;
  roomId: string;
  endpoint: string;
  displayName: string;
  isPatient: boolean;
  recordingConsent?: boolean;
  onCallEnded: () => void;
  onRecordingToggle?: (isRecording: boolean) => void;
}

interface RemoteParticipant {
  id: string;
  displayName: string;
  videoStream: MediaStream | null;
  isMuted: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function VideoCall({
  token,
  userId: _userId,
  roomId,
  endpoint: _endpoint,
  displayName,
  isPatient,
  recordingConsent = false,
  onCallEnded,
  onRecordingToggle,
}: VideoCallProps) {
  // Local state
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // Participants
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  
  // Recording (clinician only)
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<Call | null>(null);
  const callAgentRef = useRef<CallAgent | null>(null);

  // ============================================================================
  // Initialize ACS and join call
  // ============================================================================

  useEffect(() => {
    let mounted = true;
    
    const initializeCall = async () => {
      try {
        // Dynamic imports for ACS SDK
        const { CallClient, LocalVideoStream } = await import('@azure/communication-calling');
        const { AzureCommunicationTokenCredential } = await import('@azure/communication-common');
        
        // Create call client
        const callClient = new CallClient();
        
        // Create credential
        const tokenCredential = new AzureCommunicationTokenCredential(token);
        
        // Create call agent
        const callAgent = await callClient.createCallAgent(tokenCredential, {
          displayName,
        });
        
        if (!mounted) return;
        callAgentRef.current = callAgent;

        // Get local media
        const deviceManager = await callClient.getDeviceManager();
        await deviceManager.askDevicePermission({ video: true, audio: true });
        
        const cameras = await deviceManager.getCameras();
        const microphones = await deviceManager.getMicrophones();
        
        if (cameras.length === 0 || microphones.length === 0) {
          setError('Please allow camera and microphone access to join the session.');
          setIsConnecting(false);
          return;
        }

        // Create local video stream
        const localVideoStream = new LocalVideoStream(cameras[0]);
        const mediaStream = await localVideoStream.getMediaStream();
        
        if (!mounted) return;
        setLocalStream(mediaStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Join the room
        const call = callAgent.join(
          { roomId },
          {
            videoOptions: { localVideoStreams: [localVideoStream] },
            audioOptions: { muted: false },
          }
        );
        
        if (!mounted) return;
        callRef.current = call;

        // Handle call state changes
        call.on('stateChanged', () => {
          if (!mounted) return;
          
          const state = call.state;
          console.log('Call state:', state);
          
          if (state === 'Connected') {
            setIsConnecting(false);
            setIsConnected(true);
          } else if (state === 'Disconnected') {
            setIsConnected(false);
            onCallEnded();
          }
        });

        // Handle remote participants
        /* eslint-disable @typescript-eslint/no-explicit-any */
        call.on('remoteParticipantsUpdated', (event: any) => {
          if (!mounted) return;
          
          // Add new participants
          event.added?.forEach((participant: any) => {
            console.log('Participant joined:', participant.displayName);
            
            // Subscribe to video streams
            participant.on('videoStreamsUpdated', (streamEvent: any) => {
              if (!mounted) return;
              
              streamEvent.added?.forEach(async (stream: any) => {
                if (stream.isAvailable) {
                  const remoteStream = await stream.getMediaStreamTrack();
                  const mediaStream = new MediaStream([remoteStream]);
                  
                  setRemoteParticipants(prev => 
                    prev.map(p => 
                      p.id === participant.id 
                        ? { ...p, videoStream: mediaStream }
                        : p
                    )
                  );
                  
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = mediaStream;
                  }
                }
              });
            });
            
            setRemoteParticipants(prev => [...prev, {
              id: participant.id,
              displayName: participant.displayName || 'Participant',
              videoStream: null,
              isMuted: participant.isMuted,
            }]);
          });
          
          // Remove participants
          event.removed?.forEach((participant: any) => {
            console.log('Participant left:', participant.displayName);
            setRemoteParticipants(prev => 
              prev.filter(p => p.id !== participant.id)
            );
          });
        });
        /* eslint-enable @typescript-eslint/no-explicit-any */

      } catch (err) {
        console.error('Failed to initialize call:', err);
        if (mounted) {
          setError('Failed to connect to the session. Please refresh and try again.');
          setIsConnecting(false);
        }
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      // Cleanup
      if (callRef.current) {
        callRef.current.hangUp();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [token, roomId, displayName, onCallEnded, localStream]);

  // ============================================================================
  // Media controls
  // ============================================================================

  const toggleMute = useCallback(async () => {
    if (!callRef.current) return;
    
    try {
      if (isMuted) {
        await callRef.current.unmute();
      } else {
        await callRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    if (!callRef.current) return;
    
    try {
      if (isVideoOff) {
        await callRef.current.startVideo();
      } else {
        await callRef.current.stopVideo();
      }
      setIsVideoOff(!isVideoOff);
    } catch (err) {
      console.error('Failed to toggle video:', err);
    }
  }, [isVideoOff]);

  const leaveCall = useCallback(async () => {
    if (callRef.current) {
      await callRef.current.hangUp();
    }
    onCallEnded();
  }, [onCallEnded]);

  // ============================================================================
  // Recording controls (clinician only)
  // ============================================================================

  const toggleRecording = useCallback(() => {
    if (!recordingConsent) {
      // Patient didn't consent
      return;
    }
    
    const newState = !isRecording;
    setIsRecording(newState);
    onRecordingToggle?.(newState);
    
    // TODO: Implement actual recording via API
    // For now, this just sets UI state
    // The actual transcription will happen via captured audio
  }, [isRecording, recordingConsent, onRecordingToggle]);

  // ============================================================================
  // Render
  // ============================================================================

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onCallEnded}
            className="px-4 py-2 bg-bloom-primary text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Remote video (main view) */}
        <div className="absolute inset-0">
          {remoteParticipants.length > 0 ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-lg">Waiting for {isPatient ? 'your therapist' : 'patient'} to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-40 h-30 md:w-56 md:h-42 rounded-lg overflow-hidden shadow-lg bg-gray-900">
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.586a2 2 0 001.414-.586m0 0l-4.243-4.243a2 2 0 010-2.828l4.243-4.243a2 2 0 012.828 0l4.243 4.243a2 2 0 010 2.828l-4.243 4.243a2 2 0 01-2.828 0" />
              </svg>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
            You
          </div>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center bg-red-600 text-white px-3 py-1.5 rounded-full text-sm">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
            Recording
          </div>
        )}

        {/* Recording consent indicator (clinician view) */}
        {!isPatient && (
          <div className="absolute top-4 right-4">
            {recordingConsent ? (
              <div className="bg-green-600/80 text-white px-3 py-1.5 rounded-full text-sm">
                ✓ Recording consented
              </div>
            ) : (
              <div className="bg-amber-600/80 text-white px-3 py-1.5 rounded-full text-sm">
                ⚠ No recording consent
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                       ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
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

          {/* Video button */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                       ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.586a2 2 0 001.414-.586m0 0l-4.243-4.243a2 2 0 010-2.828l4.243-4.243a2 2 0 012.828 0l4.243 4.243a2 2 0 010 2.828l-4.243 4.243a2 2 0 01-2.828 0" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Recording button (clinician only) */}
          {!isPatient && (
            <button
              onClick={toggleRecording}
              disabled={!recordingConsent}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                         ${!recordingConsent 
                           ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                           : isRecording 
                             ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                             : 'bg-gray-700 hover:bg-gray-600'}`}
              title={!recordingConsent ? 'Patient has not consented to recording' : ''}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </button>
          )}

          {/* End call button */}
          <button
            onClick={leaveCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.28 3H5z" />
            </svg>
          </button>
        </div>

        {/* Connection status */}
        <div className="text-center mt-2">
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-amber-400'}`}>
            {isConnected ? '● Connected' : '○ Connecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
