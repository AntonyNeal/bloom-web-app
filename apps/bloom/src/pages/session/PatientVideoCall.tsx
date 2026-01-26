/**
 * Patient Video Call Component
 * 
 * Simplified video call UI for patients with:
 * - Local and remote video streams
 * - Call controls (mute, camera, end)
 * - Session timer
 * - Therapist information display
 * 
 * Uses Azure Communication Services for video calls.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface CallCredentials {
  token: string;
  userId: string;
  endpoint: string;
  roomId: string;
  acsRoomId: string;
}

interface SessionInfo {
  practitionerName: string;
  patientName: string;
  durationMinutes: number;
}

interface PatientVideoCallProps {
  credentials: CallCredentials;
  sessionInfo: SessionInfo;
  onCallEnded: () => void;
}

type CallState = 'connecting' | 'connected' | 'waiting' | 'disconnected';

// Design system colors
const colors = {
  sage: '#6B8E7F',
  sageDark: '#5A7D6E',
  sageLight: '#E8F0EC',
  lavender: '#9B8BC4',
  cream: '#FAF7F2',
  text: '#3A3A3A',
  textSecondary: '#6B7280',
  error: '#DC2626',
};

export function PatientVideoCall({
  credentials,
  sessionInfo,
  onCallEnded,
}: PatientVideoCallProps) {
  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ACS refs
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * End the call and clean up
   */
  const endCall = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (callRef.current) {
        await callRef.current.hangUp();
      }

      if (callAgentRef.current) {
        callAgentRef.current.dispose();
      }

      setCallState('disconnected');
      onCallEnded();
    } catch (err) {
      console.error('Error ending call:', err);
      onCallEnded();
    }
  }, [onCallEnded]);

  /**
   * Initialize ACS call
   */
  useEffect(() => {
    let mounted = true;

    const initCall = async () => {
      try {
        // Dynamic imports for ACS SDK
        const callingModule = await import('@azure/communication-calling');
        const commonModule = await import('@azure/communication-common');

        const { CallClient, LocalVideoStream, VideoStreamRenderer } = callingModule;
        const { AzureCommunicationTokenCredential } = commonModule;

        if (!mounted) return;

        // Create call client
        const callClient = new CallClient();
        callClientRef.current = callClient;

        // Create token credential
        const tokenCredential = new AzureCommunicationTokenCredential(credentials.token);

        // Create call agent
        const callAgent = await callClient.createCallAgent(tokenCredential, {
          displayName: sessionInfo.patientName || 'Patient',
        });
        callAgentRef.current = callAgent;

        // Get device manager and set up local video
        const deviceManager = await callClient.getDeviceManager();
        const cameras = await deviceManager.getCameras();

        if (cameras.length > 0) {
          const localVideoStream = new LocalVideoStream(cameras[0]);
          localVideoStreamRef.current = localVideoStream;

          // Render local video
          if (localVideoContainerRef.current) {
            const renderer = new VideoStreamRenderer(localVideoStream);
            const view = await renderer.createView({ scalingMode: 'Crop' });
            localVideoContainerRef.current.innerHTML = '';
            localVideoContainerRef.current.appendChild(view.target);
          }
        }

        // Join the room
        const roomCallLocator = { roomId: credentials.acsRoomId };
        const call = await callAgent.join(roomCallLocator, {
          videoOptions: localVideoStreamRef.current 
            ? { localVideoStreams: [localVideoStreamRef.current] }
            : undefined,
          audioOptions: { muted: false },
        });

        callRef.current = call;

        // Set up call state change handler
        call.on('stateChanged', () => {
          console.log('Call state:', call.state);
          if (call.state === 'Connected') {
            setCallState('connected');
            // Start timer when connected
            timerRef.current = setInterval(() => {
              setElapsedTime(prev => prev + 1);
            }, 1000);
          } else if (call.state === 'Disconnected') {
            setCallState('disconnected');
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            onCallEnded();
          }
        });

        // Set up remote participants handler
        const handleRemoteParticipants = async () => {
          const remoteParticipants = call.remoteParticipants;
          setHasRemoteParticipant(remoteParticipants.length > 0);

          for (const participant of remoteParticipants) {
            // Handle video streams
            for (const videoStream of participant.videoStreams) {
              if (videoStream.isAvailable && remoteVideoContainerRef.current) {
                try {
                  const renderer = new VideoStreamRenderer(videoStream);
                  const view = await renderer.createView({ scalingMode: 'Crop' });
                  remoteVideoContainerRef.current.innerHTML = '';
                  remoteVideoContainerRef.current.appendChild(view.target);
                } catch (e) {
                  console.error('Error rendering remote video:', e);
                }
              }
            }

            // Listen for video stream changes
            participant.on('videoStreamsUpdated', (e: { added: unknown[]; removed: unknown[] }) => {
              e.added.forEach(async (vs: unknown) => {
                const videoStream = vs as { isAvailable: boolean };
                if (videoStream.isAvailable && remoteVideoContainerRef.current) {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const renderer = new VideoStreamRenderer(vs as any);
                    const view = await renderer.createView({ scalingMode: 'Crop' });
                    remoteVideoContainerRef.current.innerHTML = '';
                    remoteVideoContainerRef.current.appendChild(view.target);
                  } catch (e) {
                    console.error('Error rendering remote video:', e);
                  }
                }
              });
            });
          }
        };

        call.on('remoteParticipantsUpdated', () => {
          handleRemoteParticipants();
        });

        // Initial check for remote participants
        handleRemoteParticipants();

        setCallState(call.remoteParticipants.length > 0 ? 'connected' : 'waiting');

      } catch (err) {
        console.error('Error initializing call:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to call');
        setCallState('disconnected');
      }
    };

    initCall();

    return () => {
      mounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [credentials, sessionInfo.patientName, onCallEnded]);

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
      console.error('Error toggling mute:', err);
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
      console.error('Error toggling camera:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.sessionLabel}>Session with</span>
          <span style={styles.practitionerName}>{sessionInfo.practitionerName}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.timer}>{formatTime(elapsedTime)}</span>
          {callState === 'connected' && (
            <span style={styles.connectedBadge}>● Connected</span>
          )}
        </div>
      </div>

      {/* Video area */}
      <div style={styles.videoArea}>
        {/* Remote video (therapist) - large */}
        <div 
          ref={remoteVideoContainerRef}
          style={styles.remoteVideo}
        >
          {!hasRemoteParticipant && (
            <div style={styles.waitingOverlay}>
              <div style={styles.waitingContent}>
                <div style={styles.waitingAvatar}>
                  {sessionInfo.practitionerName.charAt(0)}
                </div>
                <p style={styles.waitingText}>
                  Waiting for {sessionInfo.practitionerName} to connect...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (self) - small picture-in-picture */}
        <div 
          ref={localVideoContainerRef}
          style={styles.localVideo}
        >
          {isCameraOff && (
            <div style={styles.cameraOffOverlay}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorBar}>
          <p>{error}</p>
        </div>
      )}

      {/* Controls bar */}
      <div style={styles.controlsBar}>
        <button
          onClick={toggleMute}
          style={{
            ...styles.controlButton,
            background: isMuted ? colors.error : 'rgba(255,255,255,0.2)',
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          )}
        </button>

        <button
          onClick={toggleCamera}
          style={{
            ...styles.controlButton,
            background: isCameraOff ? colors.error : 'rgba(255,255,255,0.2)',
          }}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          )}
        </button>

        <button
          onClick={endCall}
          style={styles.endCallButton}
          title="Leave session"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
          </svg>
          <span style={styles.endCallText}>Leave</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  sessionLabel: {
    fontSize: '12px',
    opacity: 0.7,
  },
  practitionerName: {
    fontSize: '16px',
    fontWeight: 600,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  timer: {
    fontSize: '16px',
    fontFamily: 'monospace',
    background: 'rgba(255,255,255,0.1)',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  connectedBadge: {
    fontSize: '12px',
    color: '#4ade80',
    fontWeight: 500,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  remoteVideo: {
    position: 'absolute',
    inset: 0,
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localVideo: {
    position: 'absolute',
    bottom: '100px',
    right: '24px',
    width: '180px',
    height: '135px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#2a2a2a',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  waitingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 100%)',
  },
  waitingContent: {
    textAlign: 'center',
    color: 'white',
  },
  waitingAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: colors.sage,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 600,
    margin: '0 auto 16px',
    color: 'white',
  },
  waitingText: {
    fontSize: '16px',
    opacity: 0.8,
  },
  cameraOffOverlay: {
    position: 'absolute',
    inset: 0,
    background: '#3a3a3a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBar: {
    position: 'absolute',
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: colors.error,
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    background: 'rgba(0,0,0,0.7)',
  },
  controlButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  endCallButton: {
    height: '56px',
    padding: '0 24px',
    borderRadius: '28px',
    border: 'none',
    background: colors.error,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  endCallText: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
  },
};

export default PatientVideoCall;
