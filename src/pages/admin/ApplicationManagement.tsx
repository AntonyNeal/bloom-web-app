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
}

type ErrorType = 'network' | 'server' | null;

export function Admin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorType>(null);
  const [errorCode, setErrorCode] = useState<number | undefined>(undefined);
  const [lastAttempt, setLastAttempt] = useState<Date | undefined>(undefined);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
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
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
              <div className="text-2xl font-bold text-green-600">
                {counts.approved}
              </div>
              <p className="text-xs text-neutral-600">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {counts.rejected}
              </div>
              <p className="text-xs text-neutral-600">Rejected</p>
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

                {/* Action Buttons */}
                <div className="pt-4 space-y-2">
                  {selectedApp.status === "submitted" && (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() =>
                          updateStatus(selectedApp.id, "reviewing")
                        }
                        variant="secondary"
                        size="sm"
                      >
                        Review
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "approved")}
                        size="sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "rejected")}
                        variant="destructive"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {selectedApp.status === "reviewing" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "approved")}
                        size="sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateStatus(selectedApp.id, "rejected")}
                        variant="destructive"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {(selectedApp.status === "approved" ||
                    selectedApp.status === "rejected") && (
                    <Button
                      onClick={() => updateStatus(selectedApp.id, "reviewing")}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Move to Reviewing
                    </Button>
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
