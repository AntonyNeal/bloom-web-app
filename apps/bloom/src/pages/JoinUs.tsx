import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";
import { motion, useReducedMotion } from "framer-motion";
import { Tier1Flower, Tier2Flower, Tier3Flower } from "@/components/flowers";
import type { QualificationData } from "@/components/common/QualificationCheck";
import { colors } from "@/design-system/tokens";
import { TextInput, TextAreaInput, FormSection } from "@/components/forms";
import { MarketingContent } from "./JoinUs/MarketingContent";
import { SuccessState } from "./JoinUs/SuccessState";
import { FileUploadSection } from "./JoinUs/FileUploadSection";

// Lazy load the massive QualificationCheck component
const QualificationCheck = lazy(() => 
  import("@/components/common/QualificationCheck").then(m => ({ default: m.QualificationCheck }))
);

// Mobile detection hook for performance optimizations
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Use centralized design tokens
const bloomColors = colors.bloom;

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ahpra_registration: string;
  specializations: string[];
  experience_years: number;
  cover_letter: string;
  qualification_type?: 'clinical' | 'experienced' | 'phd';
  // Include all qualification check responses
  qualification_check?: {
    is_clinical_psychologist: boolean;
    has_phd: boolean;
    years_registered_ahpra: number;
  };
}

export function JoinUs() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  
  const [pageState, setPageState] = useState<'viewing' | 'qualifying' | 'applying'>('viewing');
  const [hasPassedQualificationCheck, setHasPassedQualificationCheck] = useState(false);
  const [qualificationData, setQualificationData] = useState<QualificationData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    ahpra_registration: "",
    specializations: [],
    experience_years: 0,
    cover_letter: "",
  });

  const [files, setFiles] = useState({
    cv: null as File | null,
    certificate: null as File | null,
    photo: null as File | null,
  });

  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Calculate form completion percentage for progress indicator
  const completionPercentage = useMemo(() => {
    const fields = [
      formData.first_name,
      formData.last_name,
      formData.email,
      formData.ahpra_registration,
      formData.experience_years > 0,
      formData.cover_letter,
      files.cv,
      files.certificate,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [formData, files]);

  // Stable random values for floating particles
  const particleValues = useMemo(() => {
    const count = isMobile ? 6 : 10;
    return Array.from({ length: count }, (_, i) => ({
      startX: (i / count) * 100 + (Math.random() - 0.5) * 20,
      endX: (i / count) * 100 + (Math.random() - 0.5) * 30,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 2,
      size: 4 + Math.random() * 4,
    }));
  }, [isMobile]);

  const handleFileChange =
    (type: "cv" | "certificate" | "photo") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFiles({ ...files, [type]: e.target.files[0] });
      }
    };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_ENDPOINTS.upload}?type=${type}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload files
      const cv_url = files.cv ? await uploadFile(files.cv, "cv") : "";
      const certificate_url = files.certificate
        ? await uploadFile(files.certificate, "certificate")
        : "";
      const photo_url = files.photo
        ? await uploadFile(files.photo, "photo")
        : "";

      // Submit application - include all qualification check data
      const response = await fetch(API_ENDPOINTS.applications, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          qualification_type: qualificationData?.qualificationType,
          qualification_check: qualificationData?.qualification_check,
          cv_url,
          certificate_url,
          photo_url,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Submission failed");
      }

      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "We'll review your application and be in touch soon.",
      });
    } catch {
      toast({
        title: "We're having a small hiccup",
        description: "Your application didn't quite make it through. Please check your connection and try again—we'd love to hear from you! 🌿",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <SuccessState 
        isMobile={isMobile}
        onReturnHome={() => {
          setSubmitted(false);
          setHasPassedQualificationCheck(false);
          setFormData({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            ahpra_registration: "",
            specializations: [],
            experience_years: 0,
            cover_letter: "",
          });
          setFiles({ cv: null, certificate: null, photo: null });
        }}
      />
    );
  }

  // Show qualification check when user clicks "Apply"
  if (pageState === 'qualifying' && !hasPassedQualificationCheck) {
    return (
      <Suspense fallback={<div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#6B8E7F'
      }}>Loading...</div>}>
        <QualificationCheck 
          onEligible={(data) => {
            setHasPassedQualificationCheck(true);
            setQualificationData(data);
            // Auto-populate experience years based on qualification
            setFormData(prev => ({
              ...prev,
              experience_years: data.yearsRegistered >= 8 ? data.yearsRegistered : 0
            }));
            setPageState('applying');
          }}
        />
      </Suspense>
    );
  }

  // Show marketing page by default
  if (pageState === 'viewing') {
    return <MarketingContent isMobile={isMobile} onApplyClick={() => setPageState('qualifying')} />;
  }

  // Show application form after passing qualification check
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: bloomColors.warmCream }}>
      {/* Ambient Background Layer - same as qualification check */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Watercolor Blobs */}
        {[
          { size: '850px', color: bloomColors.eucalyptusSage, opacity: 0.08, top: '-20%', right: '-10%', blur: isMobile ? 100 : 150 },
          { size: '950px', color: bloomColors.softTerracotta, opacity: 0.05, bottom: '-25%', left: '-15%', blur: isMobile ? 110 : 160 },
          { size: '750px', color: bloomColors.paleAmber, opacity: 0.06, top: '40%', left: '-10%', blur: isMobile ? 120 : 180 },
        ].map((blob, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: blob.opacity, scale: [1, 1.02, 1] }}
            transition={{
              opacity: { duration: shouldReduceMotion ? 0.1 : 0.6, delay: i * 0.15 },
              scale: { duration: 60 + i * 10, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              position: 'absolute',
              width: blob.size,
              height: blob.size,
              borderRadius: '50%',
              background: blob.color,
              filter: `blur(${blob.blur}px)`,
              ...(blob.top && { top: blob.top }),
              ...(blob.bottom && { bottom: blob.bottom }),
              ...(blob.left && { left: blob.left }),
              ...(blob.right && { right: blob.right }),
            }}
          />
        ))}

        {/* Floating Particles */}
        {particleValues.map((particle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0.6, 0],
              x: [`${particle.startX}%`, `${particle.endX}%`],
              y: ['100%', '-10%'],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              background: bloomColors.eucalyptusSage,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: isMobile ? '40px 16px' : '60px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          
          {/* Header - "Plant Your Story" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              textAlign: 'center',
              marginBottom: '48px',
            }}
          >
            {/* Animated Seedling */}
            <motion.div
              animate={{
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}
            >
              🌱
            </motion.div>
            
            <h1 style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 600,
              color: '#3A3A3A',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              marginBottom: '12px',
            }}>
              Apply to Join
            </h1>
            
            <p style={{
              fontSize: isMobile ? '15px' : '16px',
              lineHeight: 1.6,
              color: '#4A4A4A',
              maxWidth: '500px',
              margin: '0 auto',
            }}>
              Tell us about yourself and your practice. We'll review your application 
              and get back to you.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div
              style={{
                padding: isMobile ? '32px 24px' : '48px',
                background: `linear-gradient(to bottom, #FFFFFF 0%, ${bloomColors.paperWhite} 100%)`,
                borderRadius: '12px',
                boxShadow: `0 4px 24px rgba(107, 142, 127, 0.08)`,
                border: `1px solid rgba(107, 142, 127, 0.15)`,
                position: 'relative',
              }}
            >
              {/* Paper Texture Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.03,
                borderRadius: '12px',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'white\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M0 0h20v20H0V0zm20 20h20v20H20V20z\'/%3E%3C/g%3E%3C/svg%3E")',
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
              }} />

              {/* Section: Personal Information */}
              <FormSection
                title="Personal Information"
                icon={<Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />}
              >
                {/* Personal Information Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <TextInput
                    id="first_name"
                    label="First Name"
                    value={formData.first_name}
                    onChange={(val) => setFormData({ ...formData, first_name: val })}
                    required
                    placeholder="Jane"
                  />

                  <TextInput
                    id="last_name"
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(val) => setFormData({ ...formData, last_name: val })}
                    required
                    placeholder="Smith"
                  />
                </div>

                <TextInput
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(val) => setFormData({ ...formData, email: val })}
                  required
                  placeholder="jane.smith@email.com"
                />

                <TextInput
                  id="phone"
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  placeholder="+61 400 000 000"
                />
              </FormSection>

              {/* Section: Professional Details */}
              <FormSection
                title="Professional Details"
                icon={<Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />}
              >
                <TextInput
                  id="ahpra"
                  label="AHPRA Registration Number"
                  value={formData.ahpra_registration}
                  onChange={(val) => setFormData({ ...formData, ahpra_registration: val })}
                  required
                  placeholder="PSY0001234567"
                />

                <TextInput
                  id="experience"
                  label="Years of Experience"
                  type="number"
                  value={formData.experience_years?.toString() || ""}
                  onChange={(val) => setFormData({ ...formData, experience_years: parseInt(val) || 0 })}
                  required
                  placeholder="5"
                  helper={
                    qualificationData && (qualificationData.qualificationType === 'clinical' || qualificationData.qualificationType === 'phd')
                      ? "Not required for your qualification."
                      : undefined
                  }
                />
              </FormSection>

              {/* Section: Cover Letter */}
              <FormSection
                title="Cover Letter"
                icon={<Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />}
              >
                <TextAreaInput
                  id="cover_letter"
                  label="Cover Letter"
                  value={formData.cover_letter}
                  onChange={(val) => setFormData({ ...formData, cover_letter: val })}
                  required
                  rows={8}
                  placeholder="Tell us about yourself, your practice philosophy, and why you're interested in joining Life Psychology Australia."
                />
              </FormSection>

              {/* Section: Documents */}
              <FileUploadSection 
                isMobile={isMobile}
                files={files}
                onFileChange={handleFileChange}
              />

              {/* Submit Button - "Plant Your Application" */}
              <motion.button
                type="submit"
                disabled={uploading}
                whileHover={!isMobile && !uploading ? {
                  scale: 1.02,
                  boxShadow: `0 8px 28px rgba(107, 142, 127, 0.35)`,
                } : {}}
                whileTap={{ scale: uploading ? 1 : 0.98 }}
                style={{
                  width: '100%',
                  height: '56px',
                  minHeight: '48px',
                  background: uploading 
                    ? `linear-gradient(135deg, ${bloomColors.eucalyptusSage}80 0%, ${bloomColors.softFern}80 100%)`
                    : `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
                  color: bloomColors.paperWhite,
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: uploading ? 'wait' : 'pointer',
                  marginTop: '40px',
                  boxShadow: `0 4px 16px rgba(107, 142, 127, 0.25)`,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {uploading ? (
                  <>
                    <motion.div
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Planting...</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '20px' }}>🌸</span>
                    <span>Start Your Journey</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>

      {/* Progress Indicator - Floating bottom right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '24px',
          right: isMobile ? '16px' : '24px',
          zIndex: 100,
        }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 16px rgba(107, 142, 127, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Progress ring */}
          <svg width="80" height="80" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(107, 142, 127, 0.2)"
              strokeWidth="4"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={bloomColors.eucalyptusSage}
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: completionPercentage / 100 }}
              transition={{ duration: 0.5 }}
              style={{
                strokeDasharray: `${2 * Math.PI * 36}`,
              }}
            />
          </svg>
          
          {/* Growing plant icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '28px', position: 'relative', zIndex: 1 }}
          >
            {completionPercentage < 33 ? '🌱' : 
             completionPercentage < 66 ? '🌿' : 
             completionPercentage < 100 ? '🌸' : '🌺'}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
