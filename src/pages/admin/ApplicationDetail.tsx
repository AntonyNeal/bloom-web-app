import { useState, useEffect } from 'react';
import { adminService, type ApplicationDetail, type ApplicationDocument } from '../../services/adminService';
import LoadingState from "@/components/common/LoadingState";

interface Props {
  applicationId: string;
}

const statusOptions = ['Received', 'Reviewed', 'Approved', 'Rejected'];

const statusBadgeClasses = {
  Received: 'bg-blue-100 text-blue-800',
  Reviewed: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

function ApplicationDetailPage({ applicationId }: Props) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getApplicationDetail(applicationId);
      setApplication(response.application);
      setDocuments(response.documents);
      setSelectedStatus(response.application.ApplicationStatus);
      setReviewNotes(response.application.ReviewNotes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const handleUpdateStatus = async () => {
    if (!application) return;

    try {
      setUpdating(true);
      await adminService.updateStatus(applicationId, selectedStatus, 'Admin User', reviewNotes);
      setUpdateSuccess(true);
      // Reload the application data
      await loadApplication();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
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

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
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
            <dd className="mt-1 text-sm text-gray-900">{application.HasTelehealthExperience ? 'Yes' : 'No'}</dd>
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
              <div key={doc.DocumentID} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
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
    </div>
  );
}

export default ApplicationDetailPage;