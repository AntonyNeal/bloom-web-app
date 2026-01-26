/**
 * useSessionRecording Hook
 * 
 * Manages session recording with consent flow:
 * 1. Request consent from patient
 * 2. Start MediaRecorder when consent given
 * 3. Upload chunks to Azure Blob on stop
 * 
 * Uses chunked upload for reliability with large recordings.
 */

import { useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from './useAuth';

interface RecordingConsent {
  given: boolean;
  timestamp: string;
  type: 'verbal' | 'written';
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  consent: RecordingConsent | null;
  error: string | null;
  isUploading: boolean;
  uploadProgress: number;
}

interface UseSessionRecordingOptions {
  appointmentId: string;
  practitionerId: string;
  patientInitials: string;
  sessionDate: string;
  onRecordingComplete?: (blobName: string) => void;
  onError?: (error: string) => void;
}

export function useSessionRecording({
  appointmentId,
  practitionerId,
  patientInitials,
  sessionDate,
  onRecordingComplete,
  onError,
}: UseSessionRecordingOptions) {
  const { getAccessToken } = useAuth();
  
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    consent: null,
    error: null,
    isUploading: false,
    uploadProgress: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Record consent from patient
   */
  const recordConsent = useCallback((type: 'verbal' | 'written' = 'verbal') => {
    const consent: RecordingConsent = {
      given: true,
      timestamp: new Date().toISOString(),
      type,
    };
    setState(prev => ({ ...prev, consent, error: null }));
    return consent;
  }, []);

  /**
   * Revoke consent and stop any recording
   */
  const revokeConsent = useCallback(() => {
    // Stop recording if active (via ref to avoid circular dep)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState(prev => ({ ...prev, consent: null, isRecording: false }));
  }, []);

  /**
   * Start recording (requires consent)
   */
  const startRecording = useCallback(async () => {
    if (!state.consent?.given) {
      const error = 'Cannot start recording without patient consent';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    try {
      // Get screen + audio stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      // Also capture microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Combine streams
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      streamRef.current = combinedStream;

      // Prefer WebM with VP9 for quality, fall back to VP8
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Upload will be triggered by stopRecording
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ ...prev, error: 'Recording error occurred', isRecording: false }));
        onError?.('Recording error occurred');
      };

      // Start recording with 10-second chunks
      mediaRecorder.start(10000);
      startTimeRef.current = Date.now();

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: elapsed }));
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      }));

      // Handle stream ending (user stops sharing)
      displayStream.getVideoTracks()[0].onended = () => {
        // Trigger stop via state change - the stopRecording will be called by effect
        setState(prev => ({ ...prev, isRecording: false }));
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [state.consent, onError]);

  /**
   * Stop recording and upload
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !state.isRecording) return;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop recording
    mediaRecorderRef.current.stop();

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({ ...prev, isRecording: false, isUploading: true }));

    try {
      // Wait a moment for final chunks
      await new Promise(resolve => setTimeout(resolve, 500));

      // Combine chunks into single blob
      const mimeType = mediaRecorderRef.current.mimeType;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      
      // Get upload URL
      const token = await getAccessToken();
      const uploadUrlResponse = await fetch(`${API_BASE_URL}/recordings/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId,
          contentType: mimeType,
          fileSize: blob.size,
          metadata: {
            appointmentId,
            practitionerId,
            patientInitials,
            sessionDate,
            duration: state.duration,
            consentGivenAt: state.consent?.timestamp,
            consentType: state.consent?.type,
          },
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { data } = await uploadUrlResponse.json();
      const { uploadUrl, blobName } = data;

      // Upload directly to Blob Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          'x-ms-blob-type': 'BlockBlob',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload recording');
      }

      // Confirm upload with metadata
      const confirmResponse = await fetch(`${API_BASE_URL}/recordings/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blobName,
          metadata: {
            appointmentId,
            practitionerId,
            patientInitials,
            sessionDate,
            duration: state.duration,
            consentGivenAt: state.consent?.timestamp,
            consentType: state.consent?.type,
          },
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      setState(prev => ({ ...prev, isUploading: false, uploadProgress: 100 }));
      onRecordingComplete?.(blobName);

    } catch (error) {
      console.error('Error uploading recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload recording';
      setState(prev => ({ ...prev, isUploading: false, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [
    state.isRecording,
    state.duration,
    state.consent,
    appointmentId,
    practitionerId,
    patientInitials,
    sessionDate,
    getAccessToken,
    onRecordingComplete,
    onError,
  ]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  /**
   * Format duration as MM:SS
   */
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    duration: state.duration,
    formattedDuration: formatDuration(state.duration),
    consent: state.consent,
    hasConsent: state.consent?.given ?? false,
    error: state.error,
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
    
    // Actions
    recordConsent,
    revokeConsent,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}

export default useSessionRecording;
