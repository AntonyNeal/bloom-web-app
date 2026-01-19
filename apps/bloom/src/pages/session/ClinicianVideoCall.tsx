/**
 * Clinician Video Call Component
 * 
 * Full-screen video call UI for clinicians with:
 * - Local and remote video streams
 * - Call controls (mute, camera, end)
 * - Session timer
 * - Patient information display
 * - Recording indicator (when patient has consented)
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface CallCredentials {
  token: string;
  userId: string;
  endpoint: string;
  roomId: string;
  acsRoomId: string;
}

interface SessionData {
  appointmentId: string;
  patientName: string;
  patientInitials: string;
  sessionType: string;
  scheduledTime: string;
  durationMinutes: number;
}

interface ClinicianVideoCallProps {
  credentials: CallCredentials;
  sessionData: SessionData;
  onCallEnded: () => void;
}

type CallState = 'connecting' | 'connected' | 'waiting' | 'disconnected';

export function ClinicianVideoCall({
  credentials,
  sessionData,
  onCallEnded,
}: ClinicianVideoCallProps) {
  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
          displayName: 'Clinician',
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
  }, [credentials, onCallEnded]);

  /**
   * Check recording status periodically
   */
  useEffect(() => {
    const checkRecording = async () => {
      try {
        const res = await fetch(`/api/session/consent/${sessionData.appointmentId}`);
        if (res.ok) {
          const data = await res.json();
          setIsRecording(data.data?.consentGiven && !data.data?.withdrawnAt);
        }
      } catch {
        // Ignore errors
      }
    };

    // Check immediately and then every 30 seconds
    checkRecording();
    const interval = setInterval(checkRecording, 30000);

    return () => clearInterval(interval);
  }, [sessionData.appointmentId]);

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
          <div style={styles.patientInfo}>
            <div style={styles.patientAvatar}>
              {sessionData.patientInitials}
            </div>
            <div>
              <div style={styles.patientName}>{sessionData.patientName}</div>
              <div style={styles.sessionType}>{sessionData.sessionType}</div>
            </div>
          </div>
        </div>
        
        <div style={styles.headerCenter}>
          <div style={styles.timer}>{formatTime(elapsedTime)}</div>
          {isRecording && (
            <div style={styles.recordingIndicator}>
              <span style={styles.recordingDot} />
              Recording
            </div>
          )}
        </div>

        <div style={styles.headerRight}>
          <div style={{
            ...styles.statusBadge,
            ...(hasRemoteParticipant ? styles.statusConnected : styles.statusWaiting),
          }}>
            {hasRemoteParticipant ? 'Patient Connected' : 'Waiting for Patient'}
          </div>
        </div>
      </div>

      {/* Video area */}
      <div style={styles.videoArea}>
        {/* Remote video (main) */}
        <div 
          ref={remoteVideoContainerRef} 
          style={styles.remoteVideo}
        >
          {!hasRemoteParticipant && (
            <div style={styles.waitingMessage}>
              <div style={styles.waitingIcon}>👤</div>
              <p>Waiting for patient to join...</p>
              <p style={styles.waitingSubtext}>
                They&apos;ll appear here once they connect
              </p>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div 
          ref={localVideoContainerRef}
          style={{
            ...styles.localVideo,
            ...(isCameraOff ? styles.cameraOff : {}),
          }}
        >
          {isCameraOff && (
            <div style={styles.cameraOffText}>Camera Off</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button
          onClick={toggleMute}
          style={{
            ...styles.controlButton,
            ...(isMuted ? styles.controlButtonActive : {}),
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
          <span style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={toggleCamera}
          style={{
            ...styles.controlButton,
            ...(isCameraOff ? styles.controlButtonActive : {}),
          }}
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? '📵' : '📹'}
          <span style={styles.controlLabel}>{isCameraOff ? 'Start Video' : 'Stop Video'}</span>
        </button>

        <button
          onClick={endCall}
          style={styles.endCallButton}
          aria-label="End call"
        >
          📞
          <span style={styles.controlLabel}>End Session</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
        </div>
      )}

      {/* Connection status */}
      {callState === 'connecting' && (
        <div style={styles.connectingOverlay}>
          <div style={styles.spinner} />
          <p>Connecting...</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#1A202C',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  headerRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  patientInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  patientAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  patientName: {
    color: 'white',
    fontWeight: 600,
    fontSize: '14px',
  },
  sessionType: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
  },
  timer: {
    color: 'white',
    fontSize: '24px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#FC8181',
    fontSize: '12px',
    fontWeight: 500,
  },
  recordingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#FC8181',
    animation: 'pulse 1.5s infinite',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statusConnected: {
    background: 'rgba(72, 187, 120, 0.2)',
    color: '#68D391',
  },
  statusWaiting: {
    background: 'rgba(236, 201, 75, 0.2)',
    color: '#ECC94B',
  },
  videoArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  remoteVideo: {
    position: 'absolute',
    inset: 0,
    background: '#2D3748',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingMessage: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  waitingIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  waitingSubtext: {
    fontSize: '14px',
    opacity: 0.6,
    marginTop: '8px',
  },
  localVideo: {
    position: 'absolute',
    bottom: '100px',
    right: '20px',
    width: '200px',
    height: '150px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#1A202C',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  cameraOff: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOffText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '12px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.3)',
  },
  controlButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  controlButtonActive: {
    background: 'rgba(255, 255, 255, 0.25)',
  },
  controlLabel: {
    fontSize: '12px',
    fontWeight: 500,
  },
  endCallButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '16px 32px',
    background: '#C53030',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  errorBanner: {
    position: 'absolute',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    background: '#C53030',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    zIndex: 100,
  },
  connectingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 50,
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
};

export default ClinicianVideoCall;
