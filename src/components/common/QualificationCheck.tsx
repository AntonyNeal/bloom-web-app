import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, AlertCircle, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface QualificationCheckProps {
  onEligible: () => void;
}

export function QualificationCheck({ onEligible }: QualificationCheckProps) {
  const [isRegisteredPsychologist, setIsRegisteredPsychologist] = useState(false);
  const [hasPhd, setHasPhd] = useState(false);
  const [yearsRegistered, setYearsRegistered] = useState<number>(0);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

  const handleCheckEligibility = () => {
    const eligible = isRegisteredPsychologist || hasPhd || yearsRegistered >= 8;
    setIsEligible(eligible);
    
    if (eligible) {
      // Trigger parent callback after showing success message
      setTimeout(() => onEligible(), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 py-12 px-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sage-100 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-lavender-100 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/3 right-16 w-32 h-32 bg-gradient-to-br from-blush-200 to-transparent rounded-full blur-2xl opacity-20" />
      </div>

      <motion.div 
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Back to Home Button */}
        <motion.a
          href="#/"
          className="mb-6 flex items-center gap-2 text-sage-700 hover:text-sage-900 font-display text-body font-medium transition-colors duration-normal group no-underline"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform duration-normal" />
          Back to Home
        </motion.a>

        <Card className="border-sage-200 shadow-[0_4px_24px_-2px_rgba(107,128,102,0.1),0_2px_8px_-2px_rgba(107,128,102,0.05)] bg-white border border-sage-100/50">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Enhanced icon with depth and personality */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-sage-500 to-sage-600 rounded-full flex items-center justify-center shadow-lg shadow-sage-200 relative">
              <div className="absolute inset-0 rounded-full opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent" />
              <GraduationCap className="w-10 h-10 text-white relative z-10" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Sparkles className="w-4 h-4 text-lavender-300" />
              </motion.div>
            </div>
            <CardTitle className="font-display text-h1 text-text-primary">
              Qualification Check
            </CardTitle>
            <CardDescription className="font-body text-body-lg text-text-secondary leading-loose">
              To ensure quality of care, we require applicants to meet at least one of the following criteria:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Minimum Requirements Banner with enhanced warmth */}
            <div className="relative bg-gradient-to-br from-lavender-50 via-white to-sage-50 border-2 border-lavender-200 rounded-xl p-6 space-y-3 shadow-sm">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-lavender-400 rounded-full opacity-20 blur-sm" />
              <div className="relative z-10">
                <h3 className="font-display text-h5 text-text-primary mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sage-600" />
                  Minimum Requirements
                </h3>
                <p className="font-body text-body text-text-secondary leading-loose mb-4">
                To apply, you must meet at least <strong className="text-text-primary">ONE</strong> of these criteria:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 mt-0.5 flex-shrink-0" />
                  <span className="font-body text-body text-text-primary">
                    <strong>Registered Clinical Psychologist</strong> with AHPRA
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 mt-0.5 flex-shrink-0" />
                  <span className="font-body text-body text-text-primary">
                    <strong>8+ years</strong> as a registered psychologist with AHPRA
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 mt-0.5 flex-shrink-0" />
                  <span className="font-body text-body text-text-primary">
                    <strong>PhD in Psychology</strong> with current AHPRA registration
                  </span>
                </li>
              </ul>
              </div>
            </div>

            {/* Registered Clinical Psychologist */}
            <div className="space-y-3">
              <label className="flex items-start gap-4 p-5 border-2 border-sage-200 rounded-xl cursor-pointer hover:bg-sage-50 hover:border-sage-400 transition-all duration-normal">
                <input
                  type="checkbox"
                  checked={isRegisteredPsychologist}
                  onChange={(e) => setIsRegisteredPsychologist(e.target.checked)}
                  className="mt-1 w-5 h-5 text-sage-600 border-sage-300 rounded focus:ring-sage-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="font-display text-h6 text-text-primary mb-1">
                    I am a Registered Clinical Psychologist
                  </div>
                  <p className="font-body text-body-sm text-text-secondary">
                    Current AHPRA Clinical Psychology registration
                  </p>
                </div>
              </label>
            </div>

            {/* Years Registered */}
            <div className="space-y-3">
              <Label htmlFor="years" className="font-display text-h6 text-text-primary">
                Years Registered with AHPRA <span className="text-error">*</span>
              </Label>
              <Input
                id="years"
                type="number"
                min="0"
                max="50"
                value={yearsRegistered || ""}
                onChange={(e) => setYearsRegistered(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="font-body text-body border-sage-200 focus:border-sage-600 focus:ring-sage-600"
              />
              <p className="font-body text-body-sm text-text-tertiary">
                Must be 8+ years if not a Clinical Psychologist or PhD holder
              </p>
            </div>

            {/* PhD Holder */}
            <div className="space-y-3">
              <label className="flex items-start gap-4 p-5 border-2 border-sage-200 rounded-xl cursor-pointer hover:bg-sage-50 hover:border-sage-400 transition-all duration-normal">
                <input
                  type="checkbox"
                  checked={hasPhd}
                  onChange={(e) => setHasPhd(e.target.checked)}
                  className="mt-1 w-5 h-5 text-sage-600 border-sage-300 rounded focus:ring-sage-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="font-display text-h6 text-text-primary mb-1">
                    I hold a PhD in Psychology
                  </div>
                  <p className="font-body text-body-sm text-text-secondary">
                    Doctoral degree in psychology with current AHPRA registration
                  </p>
                </div>
              </label>
            </div>

            {/* Eligibility Result */}
            {isEligible === false && (
              <div className="flex items-start gap-3 p-5 bg-error-bg border-2 border-error rounded-xl">
                <AlertCircle className="w-6 h-6 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-h6 text-text-primary mb-1">
                    Minimum criteria not met
                  </h4>
                  <p className="font-body text-body-sm text-text-secondary leading-relaxed">
                    We encourage you to continue building your experience and reapply when you meet one of our criteria. We're excited to potentially work with you in the future!
                  </p>
                </div>
              </div>
            )}

            {isEligible === true && (
              <div className="flex items-start gap-3 p-5 bg-success-bg border-2 border-success rounded-xl">
                <Sparkles className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-h6 text-text-primary mb-1">
                    Fantastic! You're eligible ✨
                  </h4>
                  <p className="font-body text-body-sm text-text-secondary leading-relaxed">
                    You meet our minimum requirements. Redirecting to the application form...
                  </p>
                </div>
              </div>
            )}

            {/* Check Eligibility Button with enhanced styling */}
            <motion.div
              className="pt-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleCheckEligibility}
                className="w-full bg-gradient-to-br from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white font-display text-body font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-normal relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Check Eligibility
                </span>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
