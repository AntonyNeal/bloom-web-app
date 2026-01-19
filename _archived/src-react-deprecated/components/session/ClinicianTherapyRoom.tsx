/**
 * Clinician Therapy Room
 * 
 * Clinician view of the telehealth session.
 * Shows consent status, allows recording control, video call interface.
 */

import { useEffect, useState, useCallback } from 'react';
import { VideoCall } from './VideoCall';

// ============================================================================
// Types
// ============================================================================

interface Appointment {
  id: string;
  halaxyId: string;
  patientName: string;
  patientFirstName: string;
  patientId: string;
  time: Date;
  duration: number;
}

interface RoomStatus {
  roomId: string;
  status: 'created' | 'active' | 'ended';
  validFrom: string;
  validUntil: string;
  participants: Array<{
    type: 'clinician' | 'patient';
    name: string;
    isActive: boolean;
  }>;
  recordingConsent: 'pending' | 'consented' | 'declined';
  patientInRoom: boolean;
  clinicianInRoom: boolean;
}

interface JoinInfo {
  roomId: string;
  acsRoomId: string;
  token: string;
  tokenExpiresOn: string;
  userId: string;
  participantId: string;
  endpoint: string;
}

type ViewState = 
  | 'pre-session' 
  | 'waiting' 
  | 'in-call' 
  | 'post-session';

interface ClinicianTherapyRoomProps {
  appointment: Appointment;
  practitionerId: string;
  practitionerName: string;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ClinicianTherapyRoom({
  appointment,
  practitionerId,
  practitionerName,
  onClose,
}: ClinicianTherapyRoomProps) {
  const [viewState, setViewState] = useState<ViewState>('pre-session');
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [_isRecording, setIsRecording] = useState(false);
  const [transcriptionChunks, _setTranscriptionChunks] = useState<string[]>([]);

  // ============================================================================
  // Fetch room status
  // ============================================================================

  const fetchRoomStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/telehealth/room/status/${appointment.halaxyId}`);
      const data = await response.json();

      if (data.success) {
        setRoomStatus(data.data);
      } else if (data.code !== 'NO_ROOM') {
        console.error('Room status error:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch room status:', err);
    }
  }, [appointment.halaxyId]);

  // Poll room status when waiting
  useEffect(() => {
    if (viewState !== 'waiting') return;

    fetchRoomStatus();
    const interval = setInterval(fetchRoomStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [viewState, fetchRoomStatus]);

  // ============================================================================
  // Create room
  // ============================================================================

  const createRoom = useCallback(async () => {
    setIsCreatingRoom(true);
    setError(null);

    try {
      const response = await fetch('/api/telehealth/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.halaxyId,
          practitionerId,
          appointmentTime: appointment.time.toISOString(),
          durationMinutes: appointment.duration,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to create session room');
        return;
      }

      // Fetch updated status
      await fetchRoomStatus();
      setViewState('waiting');
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create session room. Please try again.');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [appointment, practitionerId, fetchRoomStatus]);

  // ============================================================================
  // Join call
  // ============================================================================

  const joinCall = useCallback(async () => {
    try {
      const response = await fetch('/api/telehealth/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.halaxyId,
          participantType: 'clinician',
          participantId: practitionerId,
          participantName: practitionerName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to join session');
        return;
      }

      setJoinInfo(data.data);
      setViewState('in-call');
    } catch (err) {
      console.error('Failed to join call:', err);
      setError('Failed to join session. Please try again.');
    }
  }, [appointment.halaxyId, practitionerId, practitionerName]);

  // ============================================================================
  // Leave/End call
  // ============================================================================

  const handleCallEnded = useCallback(async () => {
    if (joinInfo) {
      try {
        await fetch('/api/telehealth/room/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: joinInfo.participantId,
            endCall: true, // Clinician ends the room
          }),
        });
      } catch (err) {
        console.error('Error leaving room:', err);
      }
    }
    setViewState('post-session');
  }, [joinInfo]);

  // ============================================================================
  // Recording toggle
  // ============================================================================

  const handleRecordingToggle = useCallback(async (recording: boolean) => {
    setIsRecording(recording);
    
    if (recording) {
      // Start audio capture for transcription
      // This would integrate with the transcription API
      console.log('Starting audio capture for transcription...');
    } else {
      // Stop audio capture
      console.log('Stopping audio capture...');
      
      // If we have transcription chunks, we could process them here
      if (transcriptionChunks.length > 0) {
        console.log('Transcription complete:', transcriptionChunks.join(' '));
      }
    }
  }, [transcriptionChunks]);

  // ============================================================================
  // Render: Pre-session (before creating room)
  // ============================================================================

  if (viewState === 'pre-session') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-bloom-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-bloom-text">Therapy Room</h2>
            <p className="text-sm text-bloom-text-secondary">
              Session with {appointment.patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-bloom-text-secondary hover:text-bloom-text"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-bloom-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-bloom-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-bloom-text mb-2">
              Ready to start your session?
            </h3>
            <p className="text-bloom-text-secondary mb-4">
              Session with <strong>{appointment.patientName}</strong><br />
              Scheduled for {appointment.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={createRoom}
              disabled={isCreatingRoom}
              className="px-6 py-3 bg-bloom-primary text-white rounded-xl font-medium
                        hover:bg-bloom-primary-dark transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingRoom ? 'Creating Room...' : 'Start Session Room'}
            </button>

            <p className="text-xs text-bloom-text-secondary mt-4">
              {appointment.patientName} will receive a notification when you start the room.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Waiting room
  // ============================================================================

  if (viewState === 'waiting') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-bloom-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-bloom-text">Therapy Room</h2>
            <p className="text-sm text-bloom-text-secondary">
              Session with {appointment.patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-bloom-text-secondary hover:text-bloom-text"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Status cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Patient status */}
              <div className="bg-white rounded-xl border border-bloom-border p-4">
                <div className="flex items-center mb-3">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    roomStatus?.patientInRoom ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <h4 className="font-medium text-bloom-text">Patient Status</h4>
                </div>
                <p className="text-sm text-bloom-text-secondary">
                  {roomStatus?.patientInRoom 
                    ? `${appointment.patientFirstName} is in the waiting room`
                    : `Waiting for ${appointment.patientFirstName} to join...`
                  }
                </p>
              </div>

              {/* Recording consent */}
              <div className="bg-white rounded-xl border border-bloom-border p-4">
                <div className="flex items-center mb-3">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    roomStatus?.recordingConsent === 'consented' 
                      ? 'bg-green-500' 
                      : roomStatus?.recordingConsent === 'declined'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                  }`} />
                  <h4 className="font-medium text-bloom-text">Recording Consent</h4>
                </div>
                <p className="text-sm text-bloom-text-secondary">
                  {roomStatus?.recordingConsent === 'consented' 
                    ? 'Patient has consented to recording'
                    : roomStatus?.recordingConsent === 'declined'
                      ? 'Patient declined recording'
                      : 'Awaiting patient consent decision'
                  }
                </p>
              </div>
            </div>

            {/* Join call section */}
            <div className="bg-bloom-sage-50 rounded-xl p-6 text-center">
              {roomStatus?.patientInRoom ? (
                <>
                  <h3 className="text-lg font-semibold text-bloom-text mb-2">
                    {appointment.patientFirstName} is ready
                  </h3>
                  <p className="text-bloom-text-secondary mb-4">
                    Click below to start the video session
                  </p>
                  <button
                    onClick={joinCall}
                    className="px-6 py-3 bg-bloom-primary text-white rounded-xl font-medium
                              hover:bg-bloom-primary-dark transition-colors"
                  >
                    Join Video Call
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-3">
                    <div className="animate-pulse w-3 h-3 bg-bloom-sage-500 rounded-full mr-2" />
                    <span className="text-bloom-text-secondary">
                      Waiting for patient...
                    </span>
                  </div>
                  <p className="text-sm text-bloom-text-secondary">
                    {appointment.patientFirstName} has been sent their session link.
                  </p>
                  <button
                    onClick={joinCall}
                    className="mt-4 px-6 py-3 bg-bloom-primary text-white rounded-xl font-medium
                              hover:bg-bloom-primary-dark transition-colors"
                  >
                    Join Now (without patient)
                  </button>
                </>
              )}
            </div>

            {/* Session info */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-bloom-border">
              <h4 className="font-medium text-bloom-text mb-2">Session Details</h4>
              <dl className="text-sm space-y-1">
                <div className="flex justify-between">
                  <dt className="text-bloom-text-secondary">Patient</dt>
                  <dd className="text-bloom-text">{appointment.patientName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-bloom-text-secondary">Scheduled</dt>
                  <dd className="text-bloom-text">
                    {appointment.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-bloom-text-secondary">Duration</dt>
                  <dd className="text-bloom-text">{appointment.duration} minutes</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: In call
  // ============================================================================

  if (viewState === 'in-call' && joinInfo) {
    return (
      <VideoCall
        token={joinInfo.token}
        userId={joinInfo.userId}
        roomId={joinInfo.acsRoomId}
        endpoint={joinInfo.endpoint}
        displayName={practitionerName}
        isPatient={false}
        recordingConsent={roomStatus?.recordingConsent === 'consented'}
        onCallEnded={handleCallEnded}
        onRecordingToggle={handleRecordingToggle}
      />
    );
  }

  // ============================================================================
  // Render: Post-session
  // ============================================================================

  if (viewState === 'post-session') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-bloom-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-bloom-text">Session Complete</h2>
            <p className="text-sm text-bloom-text-secondary">
              Session with {appointment.patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-bloom-text-secondary hover:text-bloom-text"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-bloom-text mb-2">
              Session ended
            </h3>
            <p className="text-bloom-text-secondary mb-6">
              Your session with {appointment.patientName} has concluded.
            </p>

            {transcriptionChunks.length > 0 && (
              <div className="bg-bloom-sage-50 rounded-xl p-4 mb-6 text-left">
                <h4 className="font-medium text-bloom-text mb-2">Recording captured</h4>
                <p className="text-sm text-bloom-text-secondary">
                  Audio transcription is ready. You can generate clinical notes from it.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Navigate to notes for this session
                  // This would integrate with the clinical notes system
                  console.log('Navigate to notes');
                }}
                className="w-full px-6 py-3 bg-bloom-primary text-white rounded-xl font-medium
                          hover:bg-bloom-primary-dark transition-colors"
              >
                Write Clinical Notes
              </button>
              
              <button
                onClick={onClose}
                className="w-full px-6 py-3 border border-bloom-border text-bloom-text rounded-xl font-medium
                          hover:bg-bloom-sage-50 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ClinicianTherapyRoom;
