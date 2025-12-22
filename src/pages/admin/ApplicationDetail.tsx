import { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  type ApplicationDetail,
  type ApplicationDocument,
} from '../../services/adminService';
import LoadingState from '@/components/common/LoadingState';

interface Props {
  applicationId: string;
}

const statusOptions = ['Received', 'Reviewed', 'Denied', 'Waitlisted', 'Interview Scheduled', 'Accepted', 'Approved', 'Rejected'];

const statusBadgeClasses: Record<string, string> = {
  Received: 'bg-blue-100 text-blue-800',
  Reviewed: 'bg-yellow-100 text-yellow-800',
  Denied: 'bg-red-100 text-red-800',
  Waitlisted: 'bg-purple-100 text-purple-800',
  'Interview Scheduled': 'bg-cyan-100 text-cyan-800',
  Accepted: 'bg-emerald-100 text-emerald-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

// Workflow action types
type WorkflowAction = 'deny' | 'waitlist' | 'interview' | 'accept';

// Modal component for workflow actions
interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function WorkflowModal({ isOpen, onClose, title, children }: WorkflowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailPage({ applicationId }: Props) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Workflow modal states
  const [activeModal, setActiveModal] = useState<'deny' | 'waitlist' | 'interview' | 'accept' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  
  // Contract upload states
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractUploading, setContractUploading] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getApplicationDetail(applicationId);
      setApplication(response.application);
      setDocuments(response.documents);
      setSelectedStatus(response.application.ApplicationStatus);
      setReviewNotes(response.application.ReviewNotes || '');
      setAdminNotes(response.application.AdminNotes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleUpdateStatus = async () => {
    if (!application) return;

    try {
      setUpdating(true);
      await adminService.updateStatus(applicationId, selectedStatus, 'Admin User', reviewNotes);
      setUpdateSuccess(true);
      await loadApplication();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Workflow action handlers
  const handleDeny = async () => {
    if (!application) return;
    try {
      setUpdating(true);
      await adminService.updateApplication(applicationId, {
        status: 'denied',
        reviewed_by: 'Admin User',
        decision_reason: decisionReason,
        admin_notes: adminNotes,
      });
      setUpdateSuccess(true);
      setActiveModal(null);
      setDecisionReason('');
      setAdminNotes('');
      await loadApplication();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny application');
    } finally {
      setUpdating(false);
    }
  };

  const handleWaitlist = async () => {
    if (!application) return;
    try {
      setUpdating(true);
      await adminService.updateApplication(applicationId, {
        status: 'waitlisted',
        reviewed_by: 'Admin User',
        decision_reason: decisionReason,
        admin_notes: adminNotes,
      });
      setUpdateSuccess(true);
      setActiveModal(null);
      setDecisionReason('');
      setAdminNotes('');
      await loadApplication();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to waitlist application');
    } finally {
      setUpdating(false);
    }
  };

  const handleContractUpload = async (file: File) => {
    if (!application) return;
    setContractUploading(true);
    try {
      // Upload contract to blob storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', applicationId);
      formData.append('type', 'contract');
      
      const API_URL = import.meta.env.VITE_API_URL || 'https://bloom-functions-staging-new.azurewebsites.net/api';
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload contract');
      const data = await response.json();
      
      // Update application with contract URL
      await adminService.updateApplication(applicationId, {
        contract_url: data.url,
      });
      
      setContractUrl(data.url);
      setContractFile(file);
      await loadApplication();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload contract');
    } finally {
      setContractUploading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!application) return;
    // Contract is required for interview scheduling
    const currentContractUrl = application.ContractUrl || contractUrl;
    if (!currentContractUrl) {
      setError('Please upload a contract before scheduling the interview');
      return;
    }
    try {
      setUpdating(true);
      // Cal.com handles the actual scheduling - we just send the email with booking link
      await adminService.updateApplication(applicationId, {
        status: 'interview_scheduled',
        reviewed_by: 'Admin User',
        interview_notes: interviewNotes,
        admin_notes: adminNotes,
      });
      setUpdateSuccess(true);
      setActiveModal(null);
      setInterviewDate('');
      setInterviewTime('');
      setInterviewNotes('');
      setAdminNotes('');
      setContractFile(null);
      await loadApplication();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setUpdating(false);
    }
  };

  const handleAccept = async () => {
    if (!application) return;
    try {
      setUpdating(true);
      await adminService.updateApplication(applicationId, {
        status: 'accepted',
        reviewed_by: 'Admin User',
        decision_reason: decisionReason,
        admin_notes: adminNotes,
      });
      setUpdateSuccess(true);
      setActiveModal(null);
      setDecisionReason('');
      setAdminNotes('');
      await loadApplication();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept application');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadDocument = async (blobName: string) => {
    try {
      const response = await adminService.getDocumentUrl(blobName);
      window.open(response.downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  // Determine which workflow actions are available based on current status
  const getAvailableActions = (): WorkflowAction[] => {
    if (!application) return [];
    const status = application.ApplicationStatus;
    
    // Actions available based on current status
    if (status === 'Received' || status === 'Reviewed') {
      return ['deny', 'waitlist', 'interview', 'accept'];
    }
    if (status === 'Waitlisted') {
      return ['deny', 'interview', 'accept'];
    }
    if (status === 'Interview Scheduled') {
      return ['deny', 'waitlist', 'accept'];
    }
    return [];
  };

  const availableActions = getAvailableActions();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="py-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Application not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a
          href="#/admin/applications"
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          ← Back to Applications
        </a>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {application.FirstName} {application.LastName}
        </h1>
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            statusBadgeClasses[application.ApplicationStatus]
          }`}
        >
          {application.ApplicationStatus}
        </span>
      </div>

      {updateSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-medium">Status updated successfully</div>
        </div>
      )}

      {/* Workflow Actions Card */}
      {availableActions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Actions</h2>
          <p className="text-sm text-gray-600 mb-4">
            Take action on this application. Each action will update the status and can trigger an email to the applicant.
          </p>
          <div className="flex flex-wrap gap-3">
            {availableActions.includes('deny') && (
              <button
                onClick={() => setActiveModal('deny')}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Deny
              </button>
            )}
            {availableActions.includes('waitlist') && (
              <button
                onClick={() => setActiveModal('waitlist')}
                disabled={updating}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Waitlist
              </button>
            )}
            {availableActions.includes('interview') && (
              <button
                onClick={() => setActiveModal('interview')}
                disabled={updating}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Interview
              </button>
            )}
            {availableActions.includes('accept') && (
              <button
                onClick={() => setActiveModal('accept')}
                disabled={updating}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interview Info (if scheduled) */}
      {application.InterviewScheduledAt && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Interview Scheduled
          </h3>
          <p className="text-cyan-800">
            {new Date(application.InterviewScheduledAt).toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {application.InterviewNotes && (
            <p className="text-cyan-700 text-sm mt-2">
              <span className="font-medium">Notes:</span> {application.InterviewNotes}
            </p>
          )}
        </div>
      )}

      {/* Admin Notes (if any) */}
      {application.AdminNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{application.AdminNotes}</p>
        </div>
      )}

      {/* Decision Reason (if denied/waitlisted/accepted) */}
      {application.DecisionReason && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Decision Reason</h3>
          <p className="text-gray-700">{application.DecisionReason}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status (Manual)</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="review-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Review Notes
            </label>
            <textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this application..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleUpdateStatus}
            disabled={updating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.Email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.Phone}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">AHPRA Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.AHPRANumber}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Registration Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.RegistrationType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Years Registered</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.YearsRegistered}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">PhD Holder</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.IsPhDHolder ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Telehealth Experience</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {application.HasTelehealthExperience ? 'Yes' : 'No'}
            </dd>
          </div>
          {application.PreferredHoursPerWeek && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Preferred Hours Per Week</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.PreferredHoursPerWeek}</dd>
            </div>
          )}
          {application.InsuranceProvider && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Insurance Provider</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.InsuranceProvider}</dd>
            </div>
          )}
          {application.InsurancePolicyNumber && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Insurance Policy Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.InsurancePolicyNumber}</dd>
            </div>
          )}
          {application.Specializations && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Specializations</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.Specializations}</dd>
            </div>
          )}
          {application.TherapeuticApproaches && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Therapeutic Approaches</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.TherapeuticApproaches}</dd>
            </div>
          )}
          {application.AgeGroupsServed && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Age Groups Served</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.AgeGroupsServed}</dd>
            </div>
          )}
        </dl>
      </div>

      {(application.Reference1Name || application.Reference2Name) && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional References</h2>
          <div className="space-y-4">
            {application.Reference1Name && (
              <div>
                <h3 className="font-medium text-gray-900">{application.Reference1Name}</h3>
                <p className="text-sm text-gray-600">{application.Reference1Relationship}</p>
                <p className="text-sm text-gray-900">{application.Reference1Contact}</p>
              </div>
            )}
            {application.Reference2Name && (
              <div>
                <h3 className="font-medium text-gray-900">{application.Reference2Name}</h3>
                <p className="text-sm text-gray-600">{application.Reference2Relationship}</p>
                <p className="text-sm text-gray-900">{application.Reference2Contact}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents uploaded</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.DocumentID}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
              >
                <div>
                  <div className="font-medium text-gray-900">{doc.DocumentType}</div>
                  <div className="text-sm text-gray-500">{doc.FileName}</div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(doc.BlobName)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deny Modal */}
      <WorkflowModal
        isOpen={activeModal === 'deny'}
        onClose={() => setActiveModal(null)}
        title="Deny Application"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will deny the application for <strong>{application.FirstName} {application.LastName}</strong>. 
            An email will be sent to notify the applicant.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Denial <span className="text-red-500">*</span>
            </label>
            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={3}
              placeholder="e.g., Does not meet minimum experience requirements..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Notes for internal reference only..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeny}
              disabled={updating || !decisionReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Processing...' : 'Deny Application'}
            </button>
          </div>
        </div>
      </WorkflowModal>

      {/* Waitlist Modal */}
      <WorkflowModal
        isOpen={activeModal === 'waitlist'}
        onClose={() => setActiveModal(null)}
        title="Add to Waitlist"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will add <strong>{application.FirstName} {application.LastName}</strong> to the waitlist.
            An email will be sent to notify the applicant.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Waitlisting
            </label>
            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={3}
              placeholder="e.g., Currently at capacity, will review when positions open..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Notes for internal reference only..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWaitlist}
              disabled={updating}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Processing...' : 'Add to Waitlist'}
            </button>
          </div>
        </div>
      </WorkflowModal>

      {/* Schedule Interview Modal */}
      <WorkflowModal
        isOpen={activeModal === 'interview'}
        onClose={() => setActiveModal(null)}
        title="Schedule Interview"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send an interview invitation to <strong>{application.FirstName} {application.LastName}</strong>.
            The email will include a booking link and the practitioner agreement.
          </p>
          
          {/* Contract Upload Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-amber-900 mb-2">
              Practitioner Agreement <span className="text-red-500">*</span>
            </label>
            {application.ContractUrl || contractUrl ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Contract uploaded</span>
                <a 
                  href={application.ContractUrl || contractUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-2"
                >
                  View PDF
                </a>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleContractUpload(file);
                  }}
                  disabled={contractUploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 disabled:opacity-50"
                />
                {contractUploading && (
                  <p className="text-sm text-amber-600 mt-2">Uploading contract...</p>
                )}
                <p className="text-xs text-amber-700 mt-2">
                  Upload the personalized contract for this applicant (PDF only)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Notes (included in email)
            </label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Looking forward to discussing your telehealth experience..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Notes for internal reference only..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleInterview}
              disabled={updating || contractUploading || !(application.ContractUrl || contractUrl)}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Processing...' : 'Send Interview Invitation'}
            </button>
          </div>
        </div>
      </WorkflowModal>

      {/* Accept Modal */}
      <WorkflowModal
        isOpen={activeModal === 'accept'}
        onClose={() => setActiveModal(null)}
        title="Accept Application"
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-800">
              🎉 Accepting <strong>{application.FirstName} {application.LastName}</strong> will:
            </p>
            <ul className="text-sm text-emerald-700 mt-2 space-y-1 list-disc list-inside">
              <li>Send a welcome/onboarding email</li>
              <li>Mark the application as accepted</li>
              <li>Prepare them for practitioner onboarding</li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acceptance Notes
            </label>
            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={3}
              placeholder="e.g., Strong experience in CBT, excellent references..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Notes for internal reference only..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={updating}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Processing...' : 'Accept Application'}
            </button>
          </div>
        </div>
      </WorkflowModal>
    </div>
  );
}

export default ApplicationDetailPage;
