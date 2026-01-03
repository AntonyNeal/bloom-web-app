/**
 * Practitioner Management Page
 * 
 * Allows admins to:
 * - View all practitioners
 * - Activate/deactivate practitioners
 * - View onboarding status
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, CheckCircle2, Clock, UserX } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bloom-functions-staging-new.azurewebsites.net/api';

interface Practitioner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_email?: string;
  ahpra_number?: string;
  is_active: boolean;
  onboarding_completed_at?: string;
  activated_at?: string;
  created_at: string;
  application_id?: number;
  favorite_flower?: string;
}

export function PractitionerManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPractitioners = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/practitioners`);
      if (!response.ok) throw new Error('Failed to fetch practitioners');
      const data = await response.json();
      setPractitioners(data);
    } catch (error) {
      console.error('Failed to fetch practitioners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load practitioners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPractitioners();
  }, [fetchPractitioners]);

  const toggleActive = async (practitioner: Practitioner) => {
    setUpdatingId(practitioner.id);
    
    try {
      const response = await fetch(`${API_BASE_URL}/practitioners/${practitioner.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !practitioner.is_active }),
      });

      if (!response.ok) throw new Error('Failed to update practitioner');

      toast({
        title: practitioner.is_active ? '🔒 Practitioner Deactivated' : '✅ Practitioner Activated',
        description: `${practitioner.first_name} ${practitioner.last_name} is now ${practitioner.is_active ? 'hidden from' : 'visible on'} the website`,
      });

      await fetchPractitioners();
    } catch (error) {
      console.error('Failed to toggle activation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update practitioner status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (practitioner: Practitioner) => {
    if (!practitioner.onboarding_completed_at) {
      return <Badge className="bg-yellow-100 text-yellow-800">⏳ Onboarding Pending</Badge>;
    }
    if (practitioner.is_active) {
      return <Badge className="bg-emerald-100 text-emerald-800">✅ Active</Badge>;
    }
    return <Badge className="bg-neutral-100 text-neutral-600">🔒 Inactive</Badge>;
  };

  // Count stats
  const stats = {
    total: practitioners.length,
    active: practitioners.filter(p => p.is_active).length,
    pendingOnboarding: practitioners.filter(p => !p.onboarding_completed_at).length,
    inactive: practitioners.filter(p => p.onboarding_completed_at && !p.is_active).length,
  };

  return (
    <AuthenticatedLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">
              Practitioner Management
            </h1>
            <p className="text-neutral-600">
              Manage practitioner visibility and status
            </p>
          </div>
          <Button onClick={fetchPractitioners} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-neutral-500" />
              <div>
                <div className="text-2xl font-bold text-neutral-700">{stats.total}</div>
                <p className="text-xs text-neutral-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                <p className="text-xs text-neutral-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingOnboarding}</div>
                <p className="text-xs text-neutral-600">Pending Onboarding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-neutral-400" />
              <div>
                <div className="text-2xl font-bold text-neutral-500">{stats.inactive}</div>
                <p className="text-xs text-neutral-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practitioners List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-neutral-600">Loading practitioners...</p>
          </CardContent>
        </Card>
      ) : practitioners.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-neutral-600">
              No practitioners yet. Accept some applications to see them here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {practitioners.map((practitioner) => (
            <Card key={practitioner.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium text-neutral-800">
                          {practitioner.first_name} {practitioner.last_name}
                          {practitioner.favorite_flower && (
                            <span className="ml-2 text-sm" title={`Favorite flower: ${practitioner.favorite_flower}`}>
                              {practitioner.favorite_flower === 'Cherry Blossom' && '🌸'}
                              {practitioner.favorite_flower === 'Purple Rose' && '🌹'}
                              {practitioner.favorite_flower === 'Sunflower' && '🌻'}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {practitioner.company_email || practitioner.email}
                        </p>
                      </div>
                      {getStatusBadge(practitioner)}
                    </div>
                    
                    <div className="mt-2 text-xs text-neutral-500 flex flex-wrap gap-x-4 gap-y-1">
                      {practitioner.ahpra_number && (
                        <span>AHPRA: {practitioner.ahpra_number}</span>
                      )}
                      {practitioner.onboarding_completed_at && (
                        <span>
                          Onboarded: {new Date(practitioner.onboarding_completed_at).toLocaleDateString()}
                        </span>
                      )}
                      {practitioner.activated_at && (
                        <span>
                          Activated: {new Date(practitioner.activated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Only show toggle if onboarding is complete */}
                    {practitioner.onboarding_completed_at ? (
                      <Button
                        onClick={() => toggleActive(practitioner)}
                        disabled={updatingId === practitioner.id}
                        variant={practitioner.is_active ? "outline" : "default"}
                        size="sm"
                        className={practitioner.is_active 
                          ? "border-red-200 text-red-600 hover:bg-red-50" 
                          : "bg-emerald-600 hover:bg-emerald-700"}
                      >
                        {updatingId === practitioner.id 
                          ? "⏳ Updating..." 
                          : practitioner.is_active 
                            ? "🔒 Deactivate" 
                            : "✅ Activate"}
                      </Button>
                    ) : (
                      <span className="text-sm text-yellow-600">
                        Awaiting onboarding completion
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AuthenticatedLayout>
  );
}
