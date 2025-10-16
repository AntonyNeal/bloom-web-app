import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Users, 
  Calendar, 
  Settings, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowLeft
} from "lucide-react";

export function AdminDashboard() {
  // Quick stats data
  const stats = [
    { label: "Pending Applications", value: "12", icon: Clock, color: "amber" },
    { label: "Approved This Month", value: "8", icon: CheckCircle2, color: "sage" },
    { label: "Active Practitioners", value: "45", icon: Users, color: "lavender" },
    { label: "Needs Review", value: "3", icon: AlertCircle, color: "blush" },
  ];

  // Quick action cards
  const quickActions = [
    {
      title: "Application Management",
      description: "Review and process practitioner applications",
      icon: FileText,
      href: "#/admin/applications",
      color: "sage",
      badge: "12 pending"
    },
    {
      title: "Practitioner Directory",
      description: "View and manage active practitioners",
      icon: Users,
      href: "#/admin/practitioners",
      color: "lavender",
      badge: "45 active"
    },
    {
      title: "Calendar & Scheduling",
      description: "Manage appointments and availability",
      icon: Calendar,
      href: "#/admin/calendar",
      color: "blush",
      badge: "Coming soon"
    },
    {
      title: "System Settings",
      description: "Configure portal settings and preferences",
      icon: Settings,
      href: "#/admin/settings",
      color: "sage",
      badge: null
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      sage: {
        bg: "bg-sage-50",
        text: "text-sage-700",
        border: "border-sage-200",
        hover: "hover:border-sage-400 hover:bg-sage-100"
      },
      lavender: {
        bg: "bg-lavender-50",
        text: "text-lavender-700",
        border: "border-lavender-200",
        hover: "hover:border-lavender-400 hover:bg-lavender-100"
      },
      blush: {
        bg: "bg-blush-50",
        text: "text-blush-700",
        border: "border-blush-200",
        hover: "hover:border-blush-400 hover:bg-blush-100"
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        hover: "hover:border-amber-400 hover:bg-amber-100"
      }
    };
    return colors[color] || colors.sage;
  };

  return (
    <div className="min-h-screen bg-cream-100 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sage-100 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-lavender-100 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-blush-100 to-transparent rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Back to Home */}
          <motion.a
            href="#/"
            className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal group mb-6"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform duration-normal" />
            Back to Home
          </motion.a>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-sage-500 to-sage-600 rounded-full flex items-center justify-center shadow-lg shadow-sage-200 relative">
                <div className="absolute inset-0 rounded-full opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent" />
                <TrendingUp className="w-6 h-6 text-white relative z-10" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-4 h-4 text-lavender-400" />
                </motion.div>
              </div>
              <div>
                <h1 className="font-display text-h1 text-text-primary">Admin Dashboard</h1>
                <p className="font-body text-body text-text-secondary">Life Psychology Australia Portal</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = getColorClasses(stat.color);
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Card className={`${colors.border} ${colors.bg} border-2 shadow-sm hover:shadow-md transition-all duration-normal`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-body text-body-sm text-text-secondary mb-1">{stat.label}</p>
                        <p className={`font-display text-h2 ${colors.text} font-bold`}>{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center border-2 ${colors.border}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="font-display text-h3 text-text-primary mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sage-600" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colors = getColorClasses(action.color);
              const isDisabled = action.badge === "Coming soon";
              
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  whileHover={!isDisabled ? { scale: 1.02, y: -4 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                >
                  <a 
                    href={isDisabled ? "#" : action.href}
                    className={`block ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <Card className={`${colors.border} border-2 ${isDisabled ? '' : colors.hover} transition-all duration-normal shadow-sm hover:shadow-md h-full`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-14 h-14 bg-gradient-to-br from-${action.color}-500 to-${action.color}-600 rounded-xl flex items-center justify-center shadow-md shadow-${action.color}-200 relative group-hover:shadow-lg transition-all duration-normal`}>
                            <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent" />
                            <Icon className="w-7 h-7 text-white relative z-10" />
                          </div>
                          {action.badge && (
                            <span className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full font-display text-body-sm font-medium border ${colors.border}`}>
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <CardTitle className="font-display text-h4 text-text-primary">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="font-body text-body text-text-secondary leading-relaxed">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </a>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="border-sage-200 border-2 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="font-display text-h4 text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-sage-600" />
                Recent Activity
              </CardTitle>
              <CardDescription className="font-body text-body text-text-secondary">
                Latest updates and actions across the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "2 hours ago", action: "New application submitted", name: "Dr. Sarah Williams", type: "application" },
                  { time: "5 hours ago", action: "Application approved", name: "Dr. Michael Chen", type: "approval" },
                  { time: "1 day ago", action: "Profile updated", name: "Dr. Emma Thompson", type: "update" },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-sage-50 transition-colors duration-normal border border-transparent hover:border-sage-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'application' ? 'bg-amber-100 text-amber-700' :
                      activity.type === 'approval' ? 'bg-sage-100 text-sage-700' :
                      'bg-lavender-100 text-lavender-700'
                    }`}>
                      {activity.type === 'application' ? <FileText className="w-5 h-5" /> :
                       activity.type === 'approval' ? <CheckCircle2 className="w-5 h-5" /> :
                       <Users className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-body text-text-primary font-medium">{activity.action}</p>
                      <p className="font-body text-body-sm text-text-secondary">{activity.name}</p>
                    </div>
                    <span className="font-body text-body-sm text-text-tertiary flex-shrink-0">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
