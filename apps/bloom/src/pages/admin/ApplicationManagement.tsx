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
import { ArrowLeft } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import NetworkErrorState from "@/components/common/NetworkErrorState";
import ServerErrorState from "@/components/common/ServerErrorState";

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
  contract_url?: string | null;
  signed_contract_url?: string | null;
  offer_sent_at?: string | null;
  offer_accepted_at?: string | null;
  halaxy_practitioner_verified?: boolean;
}

type ErrorType = 'network' | 'server' | null;

export function Admin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorType>(null);
  const [errorCode, setErrorCode] = useState<number | undefined>(undefined);
  const [lastAttempt, setLastAttempt] = useState<Date | undefined>(undefined);
  const [isUploadingContract, setIsUploadingContract] = useState(false);

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

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.applications}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewed_by: "Admin",
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

  const uploadContract = async (applicationId: number, file: File) => {
    setIsUploadingContract(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to storage
      const uploadResponse = await fetch(`${API_ENDPOINTS.upload}?type=contracts`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload contract');
      }

      const uploadData = await uploadResponse.json();

      // Update the application with the contract URL
      const updateResponse = await fetch(`${API_ENDPOINTS.applications}/${applicationId}`, {
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
        description: err instanceof Error ? err.message : 'Failed to upload contract',
        variant: "destructive",
      });
    } finally {
      setIsUploadingContract(false);
    }
  };

  const openDocument = (url: string, _title: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Send offer to candidate (requires contract to be uploaded)
  const sendOffer = async (id: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.sendOffer(id), {
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
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "interview_scheduled":
        return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200";
      case "offer_sent":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "waitlisted":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "onboarded":
        return "bg-teal-100 text-teal-800 hover:bg-teal-200";
      case "active":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "denied":
        return "bg-red-100 text-red-800 hover:bg-red-200";
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
      interview: applications.filter((a) => a.status === "interview_scheduled").length,
      offer: applications.filter((a) => a.status === "offer_sent").length,
      waitlisted: applications.filter((a) => a.status === "waitlisted").length,
      accepted: applications.filter((a) => a.status === "accepted" || a.status === "approved").length,
      onboarded: applications.filter((a) => a.status === "onboarded").length,
      active: applications.filter((a) => a.status === "active").length,
      denied: applications.filter((a) => a.status === "denied" || a.status === "rejected").length,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <a
          href="#/admin"
          className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-semibold mb-6">Application Management</h1>
        <LoadingState />
      </div>
    );
  }

  // Network error state
  if (error === 'network') {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <a
          href="#/admin"
          className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-semibold mb-6">Application Management</h1>
        <NetworkErrorState onRetry={fetchApplications} lastAttempt={lastAttempt} />
      </div>
    );
  }

  // Server error state
  if (error === 'server') {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <a
          href="#/admin"
          className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-semibold mb-6">Application Management</h1>
        <ServerErrorState onRetry={fetchApplications} errorCode={errorCode} />
      </div>
    );
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <a
          href="#/admin"
          className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-semibold mb-6">Application Management</h1>
        <EmptyState />
      </div>
    );
  }

  const counts = getStatusCounts();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <a
        href="#/admin"
        className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </a>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-4">Application Management</h1>
        
        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{counts.total}</div>
              <p className="text-xs text-neutral-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {counts.submitted}
              </div>
              <p className="text-xs text-neutral-600">Submitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {counts.reviewing}
              </div>
              <p className="text-xs text-neutral-600">Reviewing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-cyan-600">
                {counts.interview}
              </div>
              <p className="text-xs text-neutral-600">Interview</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {counts.offer}
              </div>
              <p className="text-xs text-neutral-600">Offer Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {counts.waitlisted}
              </div>
              <p className="text-xs text-neutral-600">Waitlisted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {counts.accepted}
              </div>
              <p className="text-xs text-neutral-600">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-teal-600">
                {counts.onboarded}
              </div>
              <p className="text-xs text-neutral-600">Onboarded</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">
                {counts.active}
              </div>
              <p className="text-xs text-neutral-600">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
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
                      <a
                        href={selectedApp.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-500 hover:underline"
                      >
                        📄 View CV →
                      </a>
                    )}
                    {selectedApp.certificate_url && (
                      <a
                        href={selectedApp.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-500 hover:underline"
                      >
                        📜 View AHPRA Certificate →
                      </a>
                    )}
                    {selectedApp.photo_url && (
                      <a
                        href={selectedApp.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-500 hover:underline"
                      >
                        📷 View Professional Photo →
                      </a>
                    )}
                  </div>
                </div>

                {/* Contract Section */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="font-medium">Contracts</Label>
                  
                  {/* Admin Contract Upload */}
                  <div className={`p-3 rounded-lg border ${
                    selectedApp.contract_url 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-sm font-medium mb-2">
                      📄 Practitioner Agreement {!selectedApp.contract_url && <span className="text-gray-400 font-normal">(Optional)</span>}
                    </p>
                    {selectedApp.contract_url ? (
                      <div className="space-y-2">
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
                              const response = await fetch(`${API_ENDPOINTS.applications}/${selectedApp.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  status: selectedApp.status,
                                  contract_url: null,
                                }),
                              });
                              if (!response.ok) throw new Error('Failed to remove contract');
                              await fetchApplications();
                              if (selectedApp?.id === selectedApp.id) {
                                const appResponse = await fetch(`${API_ENDPOINTS.applications}/${selectedApp.id}`);
                                const updatedApp = await appResponse.json();
                                setSelectedApp(updatedApp);
                              }
                            } catch (error) {
                              console.error('Error removing contract:', error);
                              alert('Failed to remove contract');
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-800 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Upload a contract to send with offer</p>
                        <input
                          type="file"
                          accept=".pdf"
                          id="contract-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadContract(selectedApp.id, file);
                            e.target.value = '';
                          }}
                          disabled={isUploadingContract}
                        />
                        <label
                          htmlFor="contract-upload"
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer ${
                            isUploadingContract 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {isUploadingContract ? '⏳ Uploading...' : '📎 Attach Contract PDF'}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Signed Contract (from applicant) */}
                  {selectedApp.signed_contract_url && (
                    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                      <p className="text-sm font-medium mb-2">
                        ✍️ Signed Contract (from Applicant)
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-700">✓ Received</span>
                        <button
                          onClick={() => openDocument(selectedApp.signed_contract_url!, 'Signed Contract')}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-2 border-t">
                  <Label className="font-medium">Workflow Actions</Label>
                  
                  {/* Submitted: Move to reviewing or quick actions */}
                  {selectedApp.status === "submitted" && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "reviewing")}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        📋 Move to Reviewing
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => sendOffer(selectedApp.id)}
                          size="sm"
                          disabled={!selectedApp.contract_url}
                        >
                          ✉️ Send Offer
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

                  {/* Reviewing: Full workflow options */}
                  {selectedApp.status === "reviewing" && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "interview_scheduled")}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        📅 Schedule Interview
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => sendOffer(selectedApp.id)}
                          size="sm"
                          disabled={!selectedApp.contract_url}
                        >
                          ✉️ Send Offer
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "waitlisted")}
                          variant="outline"
                          size="sm"
                        >
                          ⏳ Waitlist
                        </Button>
                      </div>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "denied")}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        ❌ Deny Application
                      </Button>
                    </div>
                  )}

                  {/* Interview Scheduled: Post-interview actions */}
                  {selectedApp.status === "interview_scheduled" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => sendOffer(selectedApp.id)}
                          size="sm"
                          disabled={!selectedApp.contract_url}
                        >
                          ✉️ Send Offer
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "waitlisted")}
                          variant="outline"
                          size="sm"
                        >
                          ⏳ Waitlist
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "reviewing")}
                          variant="outline"
                          size="sm"
                        >
                          ↩️ Back to Review
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

                  {/* Offer Sent: Waiting for applicant response */}
                  {selectedApp.status === "offer_sent" && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-600 mb-2">
                        📨 Offer sent - waiting for response
                      </p>
                      <Button
                        onClick={() => sendOffer(selectedApp.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!selectedApp.contract_url}
                      >
                        🔄 Resend Offer Email
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "accepted")}
                          size="sm"
                          disabled={!selectedApp.signed_contract_url}
                          title={!selectedApp.signed_contract_url ? "Signed contract required to mark as accepted" : ""}
                        >
                          ✅ Mark Accepted
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "reviewing")}
                          variant="outline"
                          size="sm"
                        >
                          ↩️ Back to Review
                        </Button>
                      </div>
                      {!selectedApp.signed_contract_url && (
                        <p className="text-xs text-orange-600">
                          ⚠️ Waiting for applicant to upload signed contract
                        </p>
                      )}
                    </div>
                  )}

                  {/* Waitlisted: Can move forward or deny */}
                  {selectedApp.status === "waitlisted" && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-600 mb-2">
                        ⏳ On waitlist
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => sendOffer(selectedApp.id)}
                          size="sm"
                          disabled={!selectedApp.contract_url}
                        >
                          ✉️ Send Offer
                        </Button>
                        <Button
                          onClick={() => updateStatus(selectedApp.id, "reviewing")}
                          variant="outline"
                          size="sm"
                        >
                          ↩️ Back to Review
                        </Button>
                      </div>
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

                  {/* Accepted: Onboarding actions */}
                  {selectedApp.status === "accepted" && (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 mb-2">
                        ✅ Accepted - ready for onboarding
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "onboarded")}
                        variant="default"
                        size="sm"
                        className="w-full bg-teal-600 hover:bg-teal-700"
                      >
                        🚀 Mark as Onboarded
                      </Button>
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

                  {/* Onboarded: Activation actions */}
                  {selectedApp.status === "onboarded" && (
                    <div className="space-y-2">
                      <p className="text-sm text-teal-600 mb-2">
                        🎓 Onboarded - ready to activate
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "active")}
                        variant="default"
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        ✅ Mark as Active
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "accepted")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        ↩️ Back to Accepted
                      </Button>
                    </div>
                  )}

                  {/* Active: Practitioner is working */}
                  {selectedApp.status === "active" && (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-600 mb-2">
                        🌟 Active Practitioner
                      </p>
                      <p className="text-xs text-neutral-600 mb-2">
                        This practitioner is currently active and taking clients.
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "onboarded")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        ↩️ Back to Onboarded
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

                  {/* Legacy statuses: approved/rejected - convert them */}
                  {selectedApp.status === "approved" && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-600 mb-2">
                        ⚠️ Legacy "approved" status
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "accepted")}
                        size="sm"
                        className="w-full"
                      >
                        ✨ Convert to Accepted
                      </Button>
                    </div>
                  )}

                  {selectedApp.status === "rejected" && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-600 mb-2">
                        ⚠️ Legacy "rejected" status
                      </p>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "denied")}
                        size="sm"
                        className="w-full"
                      >
                        ✨ Convert to Denied
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
    </div>
  );
}
