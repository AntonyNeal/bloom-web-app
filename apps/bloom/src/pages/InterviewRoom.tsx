/**
 * Interview Video Room
 * 
 * Video call page for applicant interviews using Azure Communication Services.
 * Similar to the therapy room but for interviews (applicant + interviewers).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

interface InterviewDetails {
  applicantFirstName: string;
  applicantLastName: string;
  scheduledAt: string;
  durationMinutes: number;
  acsRoomId: string;
  roomStatus: string;
  interviewers: string[];
}

type PageState = 'loading' | 'early' | 'waiting' | 'joining' | 'in-call' | 'ended' | 'error';

export default function InterviewRoom() {
  const { token } = useParams<{ token: string }>();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [minutesUntilOpen, setMinutesUntilOpen] = useState<number | null>(null);
  
  // Video call state
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchInterviewDetails = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.interview}/${token}`);
      const data = await response.json();

      if (!data.success) {
        if (response.status === 425) {
          // Too early
          setMinutesUntilOpen(data.minutesUntilOpen);
          setInterview({
            applicantFirstName: '',
            applicantLastName: '',
            scheduledAt: data.interviewTime,
            durationMinutes: 30,
            acsRoomId: '',
            roomStatus: 'not-open',
            interviewers: ['Zoe', 'Julian'],
          });
          setPageState('early');
          return;
        }
        
        setError(data.error || 'Failed to load interview details');
        setPageState('error');
        return;
      }

      setInterview(data.interview);
      setPageState('waiting');
    } catch (_err) {
      setError('Unable to load interview. Please try again.');
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetchInterviewDetails();
  }, [token, fetchInterviewDetails]);

  // Handle missing token by computing error state from token
  const tokenError = !token ? 'Invalid interview link' : null;
  const effectivePageState = tokenError && pageState === 'loading' ? 'error' : pageState;
  const effectiveError = tokenError || error;

  const joinCall = useCallback(async () => {
    if (!interview?.acsRoomId) return;

    setPageState('joining');

    try {
      // Request camera/mic permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      streamRef.current = stream;

      // Display local video preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // For now, simulate a connection (full ACS integration would go here)
      // In production, this would use the ACS SDK to join the room
      setTimeout(() => {
        setIsConnected(true);
        setPageState('in-call');
        
        // Start elapsed time timer
        timerRef.current = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
      }, 1500);

    } catch (err) {
      setError('Unable to access camera/microphone. Please check your permissions.');
      setPageState('waiting');
    }
  }, [interview]);

  const leaveCall = useCallback(() => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsConnected(false);
    setPageState('ended');
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        setIsCameraOff(!isCameraOff);
      }
    }
  }, [isCameraOff]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Loading state
  if (effectivePageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300">Loading interview room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (effectivePageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Unable to Join</h1>
          <p className="text-gray-400 mb-6">{effectiveError}</p>
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="mailto:support@life-psychology.com.au" className="text-emerald-400 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Too early state
  if (pageState === 'early') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur rounded-2xl p-8 text-center border border-gray-700">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">⏰</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Interview Room Not Open Yet</h1>
          <p className="text-gray-400 mb-6">
            The interview room will open 30 minutes before your scheduled time.
          </p>
          {interview?.scheduledAt && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Your interview is scheduled for:</p>
              <p className="text-white font-medium">{formatDateTime(interview.scheduledAt)}</p>
            </div>
          )}
          {minutesUntilOpen && (
            <p className="text-emerald-400">
              Room opens in {minutesUntilOpen} minute{minutesUntilOpen !== 1 ? 's' : ''}
            </p>
          )}
          <button
            onClick={fetchInterviewDetails}
            className="mt-6 py-2 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Waiting room state
  if (pageState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">🌸</span>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Welcome, {interview?.applicantFirstName}!
            </h1>
            <p className="text-gray-400">
              Your interview with {interview?.interviewers.join(' and ')} is ready
            </p>
          </div>

          {interview?.scheduledAt && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-400 mb-1">Scheduled for:</p>
              <p className="text-white font-medium">{formatDateTime(interview.scheduledAt)}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-xl">📹</span>
              <span>Test your camera and microphone before joining</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-xl">🔇</span>
              <span>Find a quiet space with good lighting</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-xl">⏱️</span>
              <span>The interview will take about 30 minutes</span>
            </div>
          </div>

          <button
            onClick={joinCall}
            className="w-full py-4 bg-emerald-600 text-white rounded-lg font-medium text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            📹 Join Interview
          </button>
        </div>
      </div>
    );
  }

  // Joining state
  if (pageState === 'joining') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300">Joining interview...</p>
        </div>
      </div>
    );
  }

  // Call ended state
  if (pageState === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur rounded-2xl p-8 text-center border border-gray-700">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Interview Complete</h1>
          <p className="text-gray-400 mb-6">
            Thank you for taking the time to speak with us. We'll be in touch soon with next steps!
          </p>
          <p className="text-sm text-gray-500">
            Duration: {formatTime(elapsedTime)}
          </p>
        </div>
      </div>
    );
  }

  // In-call state
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video (interviewers) - full screen */}
        <div 
          ref={remoteVideoRef}
          className="w-full h-full bg-gray-800 flex items-center justify-center"
        >
          <div className="text-center text-gray-400">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-4xl">👥</span>
            </div>
            <p>Waiting for interviewers to join...</p>
          </div>
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
          />
          {isCameraOff && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
          )}
        </div>

        {/* Call info overlay */}
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
            <span className="text-white text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
          <div className="text-gray-400 text-sm">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-4">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="text-2xl text-white">{isMuted ? '🔇' : '🎤'}</span>
          </button>

          {/* Camera button */}
          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <span className="text-2xl text-white">{isCameraOff ? '📷' : '📹'}</span>
          </button>

          {/* End call button */}
          <button
            onClick={leaveCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            title="Leave interview"
          >
            <span className="text-2xl text-white">📞</span>
          </button>
        </div>
      </div>
    </div>
  );
}
