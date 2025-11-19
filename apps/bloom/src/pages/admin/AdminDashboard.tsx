import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Sparkles, ArrowLeft, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  // Quick action cards
  const quickActions = [
    {
      title: 'Application Management',
      description: 'Review and process practitioner applications',
      icon: FileText,
      href: '/admin/applications',
      color: 'sage',
    },
    {
      title: 'A/B Testing Dashboard',
      description: 'Monitor and analyze active A/B tests',
      icon: BarChart3,
      href: '/admin/ab-tests',
      color: 'lavender',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      sage: {
        bg: 'bg-sage-50',
        text: 'text-sage-700',
        border: 'border-sage-200',
        hover: 'hover:border-sage-400 hover:bg-sage-100',
      },
      lavender: {
        bg: 'bg-lavender-50',
        text: 'text-lavender-700',
        border: 'border-lavender-200',
        hover: 'hover:border-lavender-400 hover:bg-lavender-100',
      },
      blush: {
        bg: 'bg-blush-50',
        text: 'text-blush-700',
        border: 'border-blush-200',
        hover: 'hover:border-blush-400 hover:bg-blush-100',
      },
      amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        hover: 'hover:border-amber-400 hover:bg-amber-100',
      },
    };
    return colors[color] || colors.sage;
  };

  return (
    <div className="min-h-screen bg-cream-100 relative overflow-hidden admin-dashboard">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sage-100 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-lavender-100 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-blush-100 to-transparent rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="admin-card">
          {/* Back to Home */}
          {/* Back to Home */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-all duration-normal group mb-6"
            style={{
              transition: 'transform 0.2s ease',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform duration-normal" />
            Back to Home
          </button>

          <div className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sage-500 to-sage-600 rounded-full flex items-center justify-center shadow-lg shadow-sage-200 relative">
                  <div className="absolute inset-0 rounded-full opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent" />
                  <TrendingUp className="w-6 h-6 text-white relative z-10" />
                  <div className="absolute -top-1 -right-1">
                    <Sparkles
                      className="w-4 h-4 text-lavender-400"
                      style={{ animation: 'pulse 2s ease-in-out infinite' }}
                    />
                  </div>
                </div>
                <div>
                  <h1 className="font-display text-h1 text-text-primary">Admin Dashboard</h1>
                  <p className="font-body text-body text-text-secondary">
                    {user?.name || user?.username || 'Life Psychology Australia Portal'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 hover:text-sage-900 bg-sage-50 hover:bg-sage-100 border border-sage-200 hover:border-sage-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <h2 className="font-display text-h3 text-text-primary mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sage-600" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colors = getColorClasses(action.color);

              return (
                <div
                  key={action.title}
                  className="admin-card"
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                >
                  <div
                    className="block w-full text-left cursor-pointer"
                    onClick={() => navigate(action.href)}
                  >
                    <Card
                      className={`${colors.border} border-2 ${colors.hover} transition-all duration-normal shadow-sm hover:shadow-md h-full`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className={`w-14 h-14 bg-gradient-to-br from-${action.color}-500 to-${action.color}-600 rounded-xl flex items-center justify-center shadow-md shadow-${action.color}-200 relative group-hover:shadow-lg transition-all duration-normal`}
                          >
                            <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent" />
                            <Icon className="w-7 h-7 text-white relative z-10" />
                          </div>
                        </div>
                        <CardTitle className="font-display text-h4 text-text-primary">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="font-body text-body text-text-secondary leading-relaxed">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
