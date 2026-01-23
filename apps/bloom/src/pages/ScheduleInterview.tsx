/**
 * Interview Scheduling Page
 * 
 * Allows applicants to schedule their interview by selecting an available time slot.
 * Uses the same Halaxy booking system as client appointments.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface ApplicantInfo {
  firstName: string;
  lastName: string;
}

interface ScheduleResponse {
  success: boolean;
  applicant?: ApplicantInfo;
  slots?: TimeSlot[];
  durationMinutes?: number;
  alreadyScheduled?: boolean;
  scheduledAt?: string;
  error?: string;
}

export default function ScheduleInterview() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [alreadyScheduled, setAlreadyScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [interviewLink, setInterviewLink] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid scheduling link');
      setLoading(false);
      return;
    }

    fetchSlots();
  }, [token]);

  const fetchSlots = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.scheduleInterview}/${token}`);
      const data: ScheduleResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load available times');
        return;
      }

      if (data.alreadyScheduled) {
        setAlreadyScheduled(true);
        setScheduledAt(data.scheduledAt || null);
        setApplicant(data.applicant || null);
        return;
      }

      setApplicant(data.applicant || null);
      setSlots(data.slots || []);
    } catch (err) {
      setError('Unable to load scheduling options. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async () => {
    if (!selectedSlot || !token) return;

    setBooking(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.scheduleInterview}/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to book interview');
        return;
      }

      setSuccess(true);
      setScheduledAt(data.scheduledAt);
      setInterviewLink(data.interviewLink);
    } catch (err) {
      setError('Failed to book interview. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // Group slots by date for better display
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.start).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available times...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !slots.length && !alreadyScheduled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Unable to Load</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you continue to have issues, please contact us at{' '}
            <a href="mailto:support@life-psychology.com.au" className="text-emerald-600 hover:underline">
              support@life-psychology.com.au
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Already scheduled state
  if (alreadyScheduled && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Interview Already Scheduled</h1>
          {applicant && (
            <p className="text-gray-600 mb-4">
              Hi {applicant.firstName}! Your interview has already been scheduled.
            </p>
          )}
          {scheduledAt && (
            <div className="bg-emerald-50 rounded-lg p-4 mb-6">
              <p className="text-emerald-800 font-medium">{formatDateTime(scheduledAt)}</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Check your email for the interview link, or contact us if you need to reschedule.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Interview Scheduled!</h1>
          <p className="text-gray-600 mb-6">
            Your interview has been confirmed. We're looking forward to meeting you!
          </p>
          {scheduledAt && (
            <div className="bg-emerald-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-emerald-700 mb-1">Your interview is scheduled for:</p>
              <p className="text-emerald-900 font-semibold">{formatDateTime(scheduledAt)}</p>
            </div>
          )}
          <div className="space-y-4">
            {interviewLink && (
              <a
                href={interviewLink}
                className="block w-full py-3 px-6 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                📹 Save Interview Link
              </a>
            )}
            <p className="text-sm text-gray-500">
              A confirmation email with all the details has been sent to your inbox.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main scheduling UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            🌸 Schedule Your Interview
          </h1>
          {applicant && (
            <p className="text-gray-600">
              Hi {applicant.firstName}! Please select a time for your interview.
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            30-minute video call with Zoe and Julian
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* No slots available */}
        {Object.keys(slotsByDate).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📅</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">No Available Times</h2>
            <p className="text-gray-600 mb-6">
              There are currently no available interview slots. Please check back later or contact us.
            </p>
            <a
              href="mailto:support@life-psychology.com.au"
              className="text-emerald-600 hover:underline"
            >
              Contact Support
            </a>
          </div>
        ) : (
          <>
            {/* Time slots by date */}
            <div className="space-y-6 mb-8">
              {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                <div key={date} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100">
                    <h3 className="font-medium text-emerald-900">{date}</h3>
                  </div>
                  <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {dateSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedSlot?.id === slot.id
                            ? 'bg-emerald-600 text-white shadow-md scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected slot summary and confirm button */}
            {selectedSlot && (
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky bottom-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Selected time:</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(selectedSlot.start)}
                    </p>
                  </div>
                  <button
                    onClick={bookSlot}
                    disabled={booking}
                    className="py-3 px-8 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {booking ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Booking...
                      </>
                    ) : (
                      <>
                        ✓ Confirm Interview
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
