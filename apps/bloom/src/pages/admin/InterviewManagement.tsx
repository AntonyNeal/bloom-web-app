import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { BloomHeader } from "../../components/layout/BloomHeader";
import { API_ENDPOINTS } from "../../config/api";

interface Interview {
  id: number;
  application_id: number;
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_email: string;
  scheduled_interview_time: string;
  interview_token: string;
  status: string;
  interview_analyzed_at?: string | null;
  interview_recommendation?: string | null;
}

export default function InterviewManagement() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      // Fetch applications with scheduled interviews
      const response = await fetch(API_ENDPOINTS.applications);
      if (!response.ok) throw new Error("Failed to fetch interviews");
      
      const applications = await response.json();
      
      // Filter to only those with scheduled interview time
      const interviewApps = applications
        .filter((app: { scheduled_interview_time?: string | null; status?: string }) => 
          app.scheduled_interview_time && 
          ['interview_set', 'interview_complete', 'interview_scheduled'].includes(app.status || '')
        )
        .map((app: { 
          id: number; 
          first_name: string; 
          last_name: string; 
          email: string; 
          scheduled_interview_time: string; 
          interview_token?: string; 
          status: string;
          interview_analyzed_at?: string | null;
          interview_recommendation?: string | null;
        }) => ({
          id: app.id,
          application_id: app.id,
          applicant_first_name: app.first_name,
          applicant_last_name: app.last_name,
          applicant_email: app.email,
          scheduled_interview_time: app.scheduled_interview_time,
          interview_token: app.interview_token || '',
          status: app.status,
          interview_analyzed_at: app.interview_analyzed_at,
          interview_recommendation: app.interview_recommendation,
        }));
      
      setInterviews(interviewApps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  
  const filteredInterviews = interviews
    .filter(interview => {
      const interviewDate = new Date(interview.scheduled_interview_time);
      if (filter === 'upcoming') return interviewDate >= now;
      if (filter === 'past') return interviewDate < now;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_interview_time).getTime();
      const dateB = new Date(b.scheduled_interview_time).getTime();
      return filter === 'past' ? dateB - dateA : dateA - dateB;
    });

  const getStatusBadge = (interview: Interview) => {
    const interviewDate = new Date(interview.scheduled_interview_time);
    const isPast = interviewDate < now;
    
    if (interview.status === 'interview_complete' || interview.interview_analyzed_at) {
      return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
    }
    if (isPast) {
      return <Badge className="bg-amber-100 text-amber-800">Pending Review</Badge>;
    }
    // Check if interview is within next hour
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    if (interviewDate <= oneHourFromNow) {
      return <Badge className="bg-rose-100 text-rose-800">Starting Soon</Badge>;
    }
    return <Badge className="bg-sky-100 text-sky-800">Scheduled</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50">
        <BloomHeader />
        <div className="container mx-auto py-8 px-4 text-center">
          <p className="text-neutral-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50">
        <BloomHeader />
        <div className="container mx-auto py-8 px-4 text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchInterviews} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-green-50 to-cyan-50">
      <BloomHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">📅 Interviews</h1>
            <p className="text-neutral-600 mt-1">Manage scheduled practitioner interviews</p>
          </div>
          <a href="#/admin/applications">
            <Button variant="outline">← Back to Applications</Button>
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
            size="sm"
          >
            Upcoming ({interviews.filter(i => new Date(i.scheduled_interview_time) >= now).length})
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            onClick={() => setFilter('past')}
            size="sm"
          >
            Past ({interviews.filter(i => new Date(i.scheduled_interview_time) < now).length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({interviews.length})
          </Button>
        </div>

        {/* Interview List */}
        {filteredInterviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-500 text-lg">
                {filter === 'upcoming' ? 'No upcoming interviews scheduled' : 
                 filter === 'past' ? 'No past interviews' : 'No interviews found'}
              </p>
              <a href="#/admin/applications">
                <Button variant="link" className="mt-2">Go to Applications →</Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => {
              const interviewDate = new Date(interview.scheduled_interview_time);
              const isPast = interviewDate < now;
              
              return (
                <Card key={interview.id} className={isPast ? 'opacity-75' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {interview.applicant_first_name} {interview.applicant_last_name}
                        </CardTitle>
                        <CardDescription>{interview.applicant_email}</CardDescription>
                      </div>
                      {getStatusBadge(interview)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          🗓️ {formatDateTime(interview.scheduled_interview_time)}
                        </p>
                        {interview.interview_recommendation && (
                          <p className="text-sm text-neutral-600 mt-1">
                            💡 Recommendation: <span className="font-medium">{interview.interview_recommendation}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isPast && interview.interview_token && (
                          <a
                            href={`#/interview/${interview.interview_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              📹 Join Interview
                            </Button>
                          </a>
                        )}
                        <a href={`#/admin/applications?id=${interview.application_id}`}>
                          <Button variant="outline" size="sm">
                            View Application
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-sky-600">
                  {interviews.filter(i => new Date(i.scheduled_interview_time) >= now).length}
                </p>
                <p className="text-sm text-neutral-600">Upcoming Interviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {interviews.filter(i => i.status === 'interview_complete' || i.interview_analyzed_at).length}
                </p>
                <p className="text-sm text-neutral-600">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {interviews.filter(i => 
                    new Date(i.scheduled_interview_time) < now && 
                    i.status !== 'interview_complete' && 
                    !i.interview_analyzed_at
                  ).length}
                </p>
                <p className="text-sm text-neutral-600">Pending Review</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
