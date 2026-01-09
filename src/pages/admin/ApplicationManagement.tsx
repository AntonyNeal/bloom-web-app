import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import NetworkErrorState from "@/components/common/NetworkErrorState";
import ServerErrorState from "@/components/common/ServerErrorState";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ahpra_registration: string;
  experience_years: number;
  status: string;
  created_at: string;
  cv_url: string;
  certificate_url: string;
  photo_url: string;
  cover_letter: string;
  // New workflow fields
  admin_notes?: string;
  interview_scheduled_at?: string;
  interview_notes?: string;
  decision_reason?: string;
  waitlisted_at?: string;
  accepted_at?: string;
  practitioner_id?: string;
  // Offer workflow fields
  contract_url?: string;
  signed_contract_url?: string;
  offer_sent_at?: string;
  offer_accepted_at?: string;
}

type ErrorType = 'network' | 'server' | null;

export function Admin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorType>(null);
  const [errorCode, setErrorCode] = useState<number | undefined>(undefined);
  const [lastAttempt, setLastAttempt] = useState<Date | undefined>(undefined);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(undefined);
    setLastAttempt(new Date());
    
    try {
      const response = await fetch(API_ENDPOINTS.applications);
      
      if (!response.ok) {
        // Server returned an error
        setError('server');
        setErrorCode(response.status);
        return;
      }
      
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      // Network error (offline, CORS, refused connection)
      console.error("Network error:", err);
      setError('network');
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = async (url: string, docType: string) => {
    try {
      // If URL already has a SAS token, open directly
      if (url.includes('?')) {
        window.open(url, '_blank');
        return;
      }
      
      // Fetch a signed URL from the API since storage has public access disabled
      const response = await fetch(
        `${API_BASE_URL}/get-document-url?url=${encodeURIComponent(url)}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get document URL');
      }
      
      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err) {
      console.error('Error opening document:', err);
      toast({
        title: "Document Error",
        description: `Unable to open ${docType}. The document may no longer exist.`,
        variant: "destructive",
      });
    }
  };

  // Upload contract PDF for an application
  const uploadContract = async (applicationId: number, file: File) => {
    setIsUploadingContract(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to storage
      const uploadResponse = await fetch(`${API_BASE_URL}/upload?type=contracts`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload contract');
      }

      const uploadData = await uploadResponse.json();

      // Update the application with the contract URL
      const updateResponse = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedApp?.status || 'submitted',
          contract_url: uploadData.url,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to save contract URL to application');
      }

      toast({
        title: "✅ Contract Uploaded",
        description: "You can now send the offer to the candidate.",
      });

      // Refresh applications list
      await fetchApplications();
      
      // Refresh selected app
      if (selectedApp?.id === applicationId) {
        const appResponse = await fetch(`${API_ENDPOINTS.applications}/${applicationId}`);
        const updatedApp = await appResponse.json();
        setSelectedApp(updatedApp);
      }
    } catch (err) {
      console.error('Error uploading contract:', err);
      toast({
        title: "Upload Error",
        description: err instanceof Error ? err.message : "Failed to upload contract",
        variant: "destructive",
      });
    } finally {
      setIsUploadingContract(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      // If accepting, use the accept-application endpoint which also creates practitioner + sends email
      if (status === "accepted") {
        await acceptApplication(id);
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.applications}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewed_by: "Admin", // TODO: Replace with actual user when auth is added
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchApplications();
      
      // Update selected app if it's the one being modified
      if (selectedApp?.id === id) {
        const response = await fetch(`${API_ENDPOINTS.applications}/${id}`);
        const updatedApp = await response.json();
        setSelectedApp(updatedApp);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update application status. Please try again.");
    }
  };

  // Accept application - updates status, creates practitioner, and sends onboarding email
  const acceptApplication = async (id: number) => {
    setIsSendingInvite(true);
    
    try {
      // First update status to accepted
      const statusResponse = await fetch(`${API_ENDPOINTS.applications}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "accepted",
          reviewed_by: "Admin",
        }),
      });

      if (!statusResponse.ok) {
        throw new Error("Failed to update status");
      }

      // Then create practitioner and send email
      const response = await fetch(`${API_BASE_URL}/accept-application/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send onboarding invite");
      }

      toast({
        title: "✅ Application Accepted!",
        description: `Onboarding email sent to ${selectedApp?.email || 'applicant'}`,
      });

      // Refresh
      await fetchApplications();
      if (selectedApp?.id === id) {
        const appResponse = await fetch(`${API_ENDPOINTS.applications}/${id}`);
        const updatedApp = await appResponse.json();
        setSelectedApp(updatedApp);
      }
    } catch (error) {
      console.error("Failed to accept application:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept application",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Send offer to candidate (requires contract to be uploaded)
  const sendOffer = async (id: number) => {
    setIsSendingInvite(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/send-offer/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        // If offer was already accepted, auto-refresh to show correct status
        if (data.code === 'OFFER_ALREADY_ACCEPTED') {
          toast({
            title: "Already Accepted",
            description: "This applicant has already accepted the offer. Refreshing...",
          });
          await fetchApplications();
          if (selectedApp?.id === id) {
            const appResponse = await fetch(`${API_ENDPOINTS.applications}/${id}`);
            const updatedApp = await appResponse.json();
            setSelectedApp(updatedApp);
          }
          return;
        }
        throw new Error(data.error || "Failed to send offer");
      }

      toast({
        title: "📨 Offer Sent!",
        description: `Offer email sent to ${selectedApp?.email || 'applicant'}. Waiting for them to accept.`,
      });

      // Refresh
      await fetchApplications();
      if (selectedApp?.id === id) {
        const appResponse = await fetch(`${API_ENDPOINTS.applications}/${id}`);
        const updatedApp = await appResponse.json();
        setSelectedApp(updatedApp);
      }
    } catch (error) {
      console.error("Failed to send offer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send offer",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Resend onboarding email (generates new token and sends)
  const resendOnboardingEmail = async (applicationId: number) => {
    setIsSendingInvite(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/resend-onboarding/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend onboarding email");
      }

      toast({
        title: "📧 Email Sent!",
        description: `New onboarding link sent to ${selectedApp?.email || 'applicant'}`,
      });
    } catch (error) {
      console.error("Failed to resend onboarding email:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "denied":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "waitlisted":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "interview_scheduled":
        return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200";
      case "offer_sent":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "accepted":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusCounts = () => {
    return {
      total: applications.length,
      submitted: applications.filter((a) => a.status === "submitted").length,
      reviewing: applications.filter((a) => a.status === "reviewing").length,
      denied: applications.filter((a) => a.status === "denied").length,
      waitlisted: applications.filter((a) => a.status === "waitlisted").length,
      interview_scheduled: applications.filter((a) => a.status === "interview_scheduled").length,
      offer_sent: applications.filter((a) => a.status === "offer_sent").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthenticatedLayout title="Application Management" backTo="/admin">
        <LoadingState />
      </AuthenticatedLayout>
    );
  }

  // Network error state
  if (error === 'network') {
    return (
      <AuthenticatedLayout title="Application Management" backTo="/admin">
        <NetworkErrorState onRetry={fetchApplications} lastAttempt={lastAttempt} />
      </AuthenticatedLayout>
    );
  }

  // Server error state
  if (error === 'server') {
    return (
      <AuthenticatedLayout title="Application Management" backTo="/admin">
        <ServerErrorState onRetry={fetchApplications} errorCode={errorCode} />
      </AuthenticatedLayout>
    );
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <AuthenticatedLayout title="Application Management" backTo="/admin">
        <EmptyState />
      </AuthenticatedLayout>
    );
  }

  const counts = getStatusCounts();

  return (
    <AuthenticatedLayout title="Application Management" backTo="/admin">
      <div className="mb-8">
        {/* DEPLOYMENT TEST - BUILD TIME: 2026-01-09 */}
        <div className="bg-red-500 text-white text-center text-2xl font-bold py-4 mb-4">
          🚨 DEPLOYMENT VERIFICATION - If you see this, deployment is working! Build: {new Date().toISOString()}
        </div>
        
        <h1 className="text-3xl font-semibold mb-4">Application Management</h1>
        
        {/* Status Summary - Updated for new workflow */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{counts.total}</div>
              <p className="text-xs text-neutral-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-blue-600">
                {counts.submitted}
              </div>
              <p className="text-xs text-neutral-600">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-yellow-600">
                {counts.reviewing}
              </div>
              <p className="text-xs text-neutral-600">Reviewing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-cyan-600">
                {counts.interview_scheduled}
              </div>
              <p className="text-xs text-neutral-600">Interview</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-orange-600">
                {counts.offer_sent}
              </div>
              <p className="text-xs text-neutral-600">Offer Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-purple-600">
                {counts.waitlisted}
              </div>
              <p className="text-xs text-neutral-600">Waitlisted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-emerald-600">
                {counts.accepted}
              </div>
              <p className="text-xs text-neutral-600">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-red-600">
                {counts.denied}
              </div>
              <p className="text-xs text-neutral-600">Denied</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">
              Applications ({applications.length})
            </h2>
            <Button onClick={fetchApplications} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-neutral-600">
                  No applications yet
                </p>
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => (
              <Card
                key={app.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedApp?.id === app.id ? "ring-2 ring-primary-500" : ""
                }`}
                onClick={() => setSelectedApp(app)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {app.first_name} {app.last_name}
                      </CardTitle>
                      <CardDescription>{app.email}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    AHPRA: {app.ahpra_registration} | {app.experience_years}{" "}
                    years experience
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Application Detail */}
        {selectedApp ? (
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedApp.first_name} {selectedApp.last_name}
                    </CardTitle>
                    <CardDescription>{selectedApp.email}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedApp.status)}>
                    {selectedApp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p className="text-sm">{selectedApp.phone || "Not provided"}</p>
                </div>

                <div>
                  <Label className="font-medium">AHPRA Registration</Label>
                  <p className="text-sm">{selectedApp.ahpra_registration}</p>
                </div>

                <div>
                  <Label className="font-medium">Experience</Label>
                  <p className="text-sm">{selectedApp.experience_years} years</p>
                </div>

                <div>
                  <Label className="font-medium">Application Date</Label>
                  <p className="text-sm">
                    {new Date(selectedApp.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Cover Letter</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1 p-3 bg-neutral-50 rounded-md">
                    {selectedApp.cover_letter}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Documents</Label>
                  <div className="space-y-1">
                    {selectedApp.cv_url && (
                      <button
                        onClick={() => openDocument(selectedApp.cv_url, 'CV')}
                        className="block text-sm text-primary-500 hover:underline text-left"
                      >
                        📄 View CV →
                      </button>
                    )}
                    {selectedApp.certificate_url && (
                      <button
                        onClick={() => openDocument(selectedApp.certificate_url, 'AHPRA Certificate')}
                        className="block text-sm text-primary-500 hover:underline text-left"
                      >
                        📜 View AHPRA Certificate →
                      </button>
                    )}
                    {selectedApp.photo_url && (
                      <button
                        onClick={() => openDocument(selectedApp.photo_url, 'Photo')}
                        className="block text-sm text-primary-500 hover:underline text-left"
                      >
                        📷 View Professional Photo →
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons - New Workflow */}
                <div className="pt-4 space-y-3 border-t">
                  <Label className="font-medium">Actions</Label>
                  
                  {/* DEBUG CONTRACT INFO */}
                  <div className="bg-yellow-100 border-2 border-yellow-500 p-2 text-xs font-mono">
                    <div>contract_url: {JSON.stringify(selectedApp.contract_url)}</div>
                    <div>Has contract? {String(!!selectedApp.contract_url)}</div>
                    <div>Should disable? {String(!selectedApp.contract_url)}</div>
                  </div>
                  
                  {/* New applications: Direct decision options */}
                  {selectedApp.status === "submitted" && (
                    <div className="space-y-3">
                      {/* Contract Upload */}
                      <div className={`p-3 rounded-lg border ${
                        selectedApp.contract_url 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <p className="text-sm font-medium mb-2">
                          📄 Contract Required for Accept
                        </p>
                        {selectedApp.contract_url ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-700">✓ Contract attached</span>
                              <button
                                onClick={() => openDocument(selectedApp.contract_url!, 'Contract')}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm('Remove this contract? You can upload a different one after.')) return;
                                try {
                                  const response = await fetch(`${API_BASE_URL}/applications/${selectedApp.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: selectedApp.status,
                                      contract_url: null,
                                    }),
                                  });
                                  if (!response.ok) throw new Error('Failed to remove contract');
                                  const updatedApp = await response.json();
                                  setSelectedApp(updatedApp);
                                  toast({ title: 'Contract removed' });
                                  await fetchApplications();
                                } catch (error) {
                                  console.error('Error removing contract:', error);
                                  toast({ title: 'Failed to remove contract', variant: 'destructive' });
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-amber-700 mb-2">Upload a signed contract before accepting</p>
                            <input
                              type="file"
                              accept=".pdf"
                              id="contract-upload-submitted"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadContract(selectedApp.id, file);
                                e.target.value = '';
                              }}
                              disabled={isUploadingContract}
                            />
                            <label
                              htmlFor="contract-upload-submitted"
                              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 ${
                                isUploadingContract ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              {isUploadingContract ? '⏳ Uploading...' : '📎 Attach Contract PDF'}
                            </label>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "interview_scheduled")}
                        variant="secondary"
                        size="sm"
                      >
                        📅 Interview
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "waitlisted")}
                        variant="outline"
                        size="sm"
                      >
                        ⏳ Waitlist
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "accepted")}
                        disabled={!selectedApp.contract_url}
                        className={cn(
                          "bg-emerald-600 hover:bg-emerald-700",
                          !selectedApp.contract_url && "opacity-30 bg-gray-400 cursor-not-allowed pointer-events-none hover:bg-gray-400"
                        )}
                        size="sm"
                      >
                        ✅ Accept
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "denied")}
                        variant="destructive"
                        size="sm"
                      >
                        ❌ Reject
                      </Button>
                    </div>
                    </div>
                  )}

                  {/* Under review: Full set of decision options */}
                  {selectedApp.status === "reviewing" && (
                    <div className="space-y-3">
                      {/* Optional Contract Attachment */}
                      <div className={`p-3 rounded-lg border ${
                        selectedApp.contract_url 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="text-sm font-medium mb-2">
                          📄 Practitioner Agreement <span className="text-gray-400 font-normal">(Optional)</span>
                        </p>
                        {selectedApp.contract_url ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-700">✓ Contract attached</span>
                              <button
                                onClick={() => openDocument(selectedApp.contract_url!, 'Contract')}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm('Remove this contract?')) return;
                                try {
                                  const response = await fetch(`${API_BASE_URL}/applications/${selectedApp.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: selectedApp.status,
                                      contract_url: null,
                                    }),
                                  });
                                  if (!response.ok) throw new Error('Failed to remove contract');
                                  toast({ title: 'Contract removed' });
                                  await fetchApplications();
                                  if (selectedApp?.id) {
                                    const updated = applications.find(a => a.id === selectedApp.id);
                                    if (updated) setSelectedApp(updated);
                                  }
                                } catch (error) {
                                  console.error('Error removing contract:', error);
                                  toast({ title: 'Failed to remove contract', variant: 'destructive' });
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Attach contract to include with the offer</p>
                            <input
                              type="file"
                              accept=".pdf"
                              id="contract-upload-reviewing"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadContract(selectedApp.id, file);
                                e.target.value = '';
                              }}
                              disabled={isUploadingContract}
                            />
                            <label
                              htmlFor="contract-upload-reviewing"
                              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer ${
                                isUploadingContract 
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                  : 'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              {isUploadingContract ? '⏳ Uploading...' : '📎 Attach Contract (PDF)'}
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Send Offer Button */}
                      <Button
                        onClick={() => sendOffer(selectedApp.id)}
                        className={cn(
                          "w-full",
                          !selectedApp.contract_url && "opacity-30 bg-gray-400 cursor-not-allowed pointer-events-none",
                          selectedApp.contract_url && "bg-emerald-600 hover:bg-emerald-700"
                        )}
                        size="sm"
                        disabled={isSendingInvite || !selectedApp.contract_url}
                      >
                        {isSendingInvite ? "⏳ Sending..." : selectedApp.contract_url ? "📨 Send Offer (with Contract)" : "📨 Send Offer"}
                      </Button>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "interview_scheduled")}
                          variant="secondary"
                          size="sm"
                        >
                          📅 Schedule Interview
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "waitlisted")}
                          variant="outline"
                          size="sm"
                        >
                          ⏳ Waitlist
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "denied")}
                          variant="destructive"
                          size="sm"
                          className="col-span-2"
                        >
                          ❌ Deny
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Interview scheduled: After interview decisions */}
                  {selectedApp.status === "interview_scheduled" && (
                    <div className="space-y-3">
                      {selectedApp.interview_scheduled_at && (
                        <p className="text-sm text-cyan-600 mb-2">
                          📅 Interview: {new Date(selectedApp.interview_scheduled_at).toLocaleString()}
                        </p>
                      )}
                      
                      {/* Optional Contract Upload Section */}
                      <div className={`p-3 rounded-lg border ${
                        selectedApp.contract_url 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="text-sm font-medium mb-2">
                          📄 Practitioner Agreement <span className="text-gray-400 font-normal">(Optional)</span>
                        </p>
                        {selectedApp.contract_url ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-700">✓ Contract attached</span>
                              <button
                                onClick={() => openDocument(selectedApp.contract_url!, 'Contract')}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm('Remove this contract?')) return;
                                try {
                                  const response = await fetch(`${API_BASE_URL}/applications/${selectedApp.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: selectedApp.status,
                                      contract_url: null,
                                    }),
                                  });
                                  if (!response.ok) throw new Error('Failed to remove contract');
                                  toast({ title: 'Contract removed' });
                                  await fetchApplications();
                                  if (selectedApp?.id) {
                                    const updated = applications.find(a => a.id === selectedApp.id);
                                    if (updated) setSelectedApp(updated);
                                  }
                                } catch (error) {
                                  console.error('Error removing contract:', error);
                                  toast({ title: 'Failed to remove contract', variant: 'destructive' });
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Attach contract to include with the offer</p>
                            <input
                              type="file"
                              accept=".pdf"
                              id="contract-upload-interview"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadContract(selectedApp.id, file);
                                e.target.value = '';
                              }}
                              disabled={isUploadingContract}
                            />
                            <label
                              htmlFor="contract-upload-interview"
                              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer ${
                                isUploadingContract 
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                  : 'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              {isUploadingContract ? '⏳ Uploading...' : '📎 Attach Contract (PDF)'}
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Send Offer Button */}
                      <Button
                        onClick={() => sendOffer(selectedApp.id)}
                        className={cn(
                          "w-full",
                          !selectedApp.contract_url && "opacity-30 bg-gray-400 cursor-not-allowed pointer-events-none",
                          selectedApp.contract_url && "bg-emerald-600 hover:bg-emerald-700"
                        )}
                        size="sm"
                        disabled={isSendingInvite || !selectedApp.contract_url}
                      >
                        {isSendingInvite ? "⏳ Sending..." : selectedApp.contract_url ? "📨 Send Offer (with Contract)" : "📨 Send Offer"}
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "waitlisted")}
                          variant="outline"
                          size="sm"
                        >
                          ⏳ Waitlist
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "denied")}
                          variant="destructive"
                          size="sm"
                        >
                          ❌ Deny
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Offer sent: Waiting for candidate to accept */}
                  {selectedApp.status === "offer_sent" && (
                    <div className="space-y-3">
                      {selectedApp.offer_sent_at && (
                        <p className="text-sm text-orange-600 mb-2">
                          📨 Offer sent: {new Date(selectedApp.offer_sent_at).toLocaleDateString()}
                        </p>
                      )}

                      {/* Contract Status */}
                      {selectedApp.contract_url && (
                        <div className={`p-3 rounded-lg border ${
                          selectedApp.signed_contract_url 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-amber-50 border-amber-200'
                        }`}>
                          <p className="text-sm font-medium mb-2">📄 Contract Status</p>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-green-700">✓ Contract sent</span>
                            <button
                              onClick={() => openDocument(selectedApp.contract_url!, 'Contract')}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View PDF
                            </button>
                          </div>
                          {selectedApp.signed_contract_url ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-700">✓ Signed contract received</span>
                              <button
                                onClick={() => openDocument(selectedApp.signed_contract_url!, 'Signed Contract')}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600">⏳ Waiting for applicant to sign and upload</p>
                          )}
                        </div>
                      )}

                      {/* Status message */}
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800 font-medium">
                          ⏳ Waiting for candidate to accept offer
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          {selectedApp.contract_url 
                            ? 'Candidate must accept offer and upload signed contract'
                            : 'Candidate must accept the offer'}
                        </p>
                      </div>

                      {/* Resend Offer Button */}
                      <Button
                        onClick={() => sendOffer(selectedApp.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isSendingInvite}
                      >
                        {isSendingInvite ? "⏳ Sending..." : "🔄 Resend Offer Email"}
                      </Button>

                      {/* Onboard Button - greyed out until signed contract received */}
                      <Button
                        onClick={() => acceptApplication(selectedApp.id)}
                        className={`w-full ${
                          selectedApp.signed_contract_url 
                            ? 'bg-emerald-600 hover:bg-emerald-700' 
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                        size="sm"
                        disabled={!selectedApp.signed_contract_url || isSendingInvite}
                      >
                        {isSendingInvite ? '⏳ Sending...' : '🚀 Send Onboarding Invite'}
                      </Button>
                      {!selectedApp.signed_contract_url && selectedApp.contract_url && (
                        <p className="text-xs text-gray-500 text-center">
                          Onboarding available after applicant uploads signed contract
                        </p>
                      )}

                      <Button
                        onClick={() => updateStatus(selectedApp.id, "interview_scheduled")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        ↩️ Move Back to Interview
                      </Button>
                    </div>
                  )}

                  {/* Waitlisted: Can be moved to interview */}
                  {selectedApp.status === "waitlisted" && (
                    <div className="space-y-2">
                      {selectedApp.waitlisted_at && (
                        <p className="text-sm text-purple-600 mb-2">
                          ⏳ Waitlisted: {new Date(selectedApp.waitlisted_at).toLocaleDateString()}
                        </p>
                      )}
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "interview_scheduled")}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        📅 Schedule Interview
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "denied")}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        ❌ Deny
                      </Button>
                    </div>
                  )}

                  {/* Accepted: Onboarding in progress */}
                  {selectedApp.status === "accepted" && (
                    <div className="space-y-3">
                      {selectedApp.accepted_at && (
                        <p className="text-sm text-emerald-600 mb-2">
                          ✅ Offer accepted: {new Date(selectedApp.accepted_at).toLocaleDateString()}
                        </p>
                      )}

                      {/* Contract Status */}
                      {(selectedApp.contract_url || selectedApp.signed_contract_url) && (
                        <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                          <p className="text-sm font-medium mb-2">📄 Contract Status</p>
                          {selectedApp.contract_url && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-green-700">✓ Contract sent</span>
                              <button
                                onClick={() => openDocument(selectedApp.contract_url!, 'Contract')}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </div>
                          )}
                          {selectedApp.signed_contract_url && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-700">✓ Signed contract received</span>
                              <button
                                onClick={() => openDocument(selectedApp.signed_contract_url!, 'Signed Contract')}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedApp.practitioner_id ? (
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                          <p className="text-sm text-emerald-800 font-medium">
                            📧 Onboarding email sent
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            Waiting for practitioner to complete onboarding
                          </p>
                          <Button
                            onClick={() => resendOnboardingEmail(selectedApp.id)}
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            disabled={isSendingInvite}
                          >
                            {isSendingInvite ? "⏳ Sending..." : "🔄 Resend Onboarding Email"}
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                          <p className="text-sm font-medium">
                            ⚠️ Practitioner record not created
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Click below to send the onboarding invite.
                          </p>
                          <Button
                            onClick={() => acceptApplication(selectedApp.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 w-full mt-2"
                            size="sm"
                            disabled={isSendingInvite}
                          >
                            {isSendingInvite ? "⏳ Sending..." : "📧 Send Onboarding Invite"}
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "reviewing")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        ↩️ Move Back to Reviewing
                      </Button>
                    </div>
                  )}

                  {/* Denied: Can reopen */}
                  {selectedApp.status === "denied" && (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600 mb-2">
                        ❌ Application denied
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "reviewing")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        ↩️ Reopen Application
                      </Button>
                    </div>
                  )}

                  {/* Handle old approved status - treat as accepted */}
                  {selectedApp.status === "approved" && (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-600 mb-2">
                        ✅ Application approved
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "accepted")}
                        className="bg-emerald-600 hover:bg-emerald-700 w-full"
                        size="sm"
                      >
                        ✨ Convert to Accepted
                      </Button>
                    </div>
                  )}

                  {/* Handle old rejected status - treat as denied */}
                  {selectedApp.status === "rejected" && (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600 mb-2">
                        ❌ Application rejected
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "denied")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Convert to Denied
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-neutral-600">
                  Select an application to view details
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
