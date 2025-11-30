import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { motion, useReducedMotion } from 'framer-motion';
import { Tier1Flower, Tier2Flower, Tier3Flower } from '@/components/flowers';
import type { QualificationData } from '@/components/common/QualificationCheck';
import { BloomJourneyInfographic } from '@/components/join-us/BloomJourneyInfographic';

// Lazy load the massive QualificationCheck component
const QualificationCheck = lazy(() =>
  import('@/components/common/QualificationCheck').then((m) => ({ default: m.QualificationCheck }))
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

// Bloom design system colors
const bloomStyles = {
  colors: {
    eucalyptusSage: '#6B8E7F',
    softFern: '#8FA892',
    paleAmber: '#F5E6D3',
    softTerracotta: '#D4A28F',
    honeyAmber: '#E8B77D',
    clayTerracotta: '#C89B7B',
    warmCream: '#FAF7F2',
    paperWhite: '#FEFDFB',
  },
};

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

// Marketing Content Component - Uses the interactive journey infographic
function MarketingContent({
  isMobile,
  onApplyClick,
}: {
  isMobile: boolean;
  onApplyClick: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      style={{ position: 'relative', minHeight: '100vh', background: bloomStyles.colors.warmCream }}
    >
      {/* Ambient Background - Optimized for desktop performance */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {[
          {
            size: '850px',
            color: bloomStyles.colors.eucalyptusSage,
            opacity: 0.06,
            top: '-15%',
            right: '-8%',
            blur: isMobile ? 140 : 70,
          },
          {
            size: '950px',
            color: bloomStyles.colors.softTerracotta,
            opacity: 0.04,
            bottom: '-20%',
            left: '-12%',
            blur: isMobile ? 150 : 75,
          },
        ].map((blob, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: blob.opacity,
              scale: isMobile || prefersReducedMotion ? 1 : [1, 1.01, 1],
            }}
            transition={{
              opacity: { duration: 0.8, delay: i * 0.2 },
              scale: {
                duration: 60 + i * 10,
                repeat: isMobile || prefersReducedMotion ? 0 : Infinity,
                ease: 'easeInOut',
              },
            }}
            style={{
              position: 'absolute',
              width: blob.size,
              height: blob.size,
              borderRadius: '50%',
              background: blob.color,
              filter: `blur(${blob.blur}px)`,
              willChange: isMobile || prefersReducedMotion ? 'auto' : 'transform',
              ...(blob.top && { top: blob.top }),
              ...(blob.bottom && { bottom: blob.bottom }),
              ...(blob.left && { left: blob.left }),
              ...(blob.right && { right: blob.right }),
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            padding: isMobile ? '60px 20px 40px' : '100px 40px 60px',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: isMobile ? '40px' : '56px',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softTerracotta} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '20px',
            }}
          >
            Practice Your Way
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              fontSize: isMobile ? '18px' : '22px',
              lineHeight: 1.6,
              color: '#4A4A4A',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            <strong>No need to quit your current job.</strong> Bloom can supplement your income or
            become your full-time career—your choice. Work completely on your schedule.
            <br />
            <strong>Bloom fits into your life, not the other way around.</strong>
          </motion.p>
        </motion.section>

        {/* Interactive Journey Infographic */}
        <BloomJourneyInfographic isMobile={isMobile} onApplyClick={onApplyClick} />

        {/* Founder Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            padding: isMobile ? '40px 20px 80px' : '60px 40px 120px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              padding: isMobile ? '44px 28px' : '64px 56px',
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 247, 242, 0.85) 100%)`,
              backdropFilter: isMobile ? 'blur(10px)' : 'blur(5px)',
              borderRadius: '24px',
              border: `2px solid ${bloomStyles.colors.eucalyptusSage}20`,
              boxShadow: '0 8px 32px rgba(107, 142, 127, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${bloomStyles.colors.eucalyptusSage}, ${bloomStyles.colors.softTerracotta})`,
                opacity: 0.5,
              }}
            />

            <h2
              style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: 700,
                color: bloomStyles.colors.eucalyptusSage,
                marginBottom: '28px',
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              Why This Exists
            </h2>
            <div
              style={{
                fontSize: isMobile ? '16px' : '17px',
                lineHeight: 1.9,
                color: '#3A3A3A',
              }}
            >
              <p style={{ marginBottom: '24px' }}>
                I'm Zoe Semmler, a clinical psychologist. I started this because I kept watching
                talented colleagues burn out—not because they stopped caring, but because the
                traditional practice model didn't work for them.
              </p>
              <blockquote
                style={{
                  fontSize: isMobile ? '19px' : '22px',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: bloomStyles.colors.eucalyptusSage,
                  background: `${bloomStyles.colors.eucalyptusSage}08`,
                  borderLeft: `4px solid ${bloomStyles.colors.eucalyptusSage}`,
                  paddingLeft: '28px',
                  paddingRight: '20px',
                  paddingTop: '24px',
                  paddingBottom: '24px',
                  margin: '36px 0',
                  borderRadius: '0 12px 12px 0',
                }}
              >
                "What if psychologists kept most of what they earned, we provided the technology for
                a more human-centred practice, and we brought them clients?"
              </blockquote>
              <p
                style={{
                  marginBottom: '24px',
                  fontSize: isMobile ? '17px' : '18px',
                  fontWeight: 500,
                }}
              >
                That's the premise. Fair pay. Modern systems. Marketing support.
              </p>
              <p style={{ fontSize: isMobile ? '16px' : '17px' }}>
                This practice is built on respect—for your expertise, your time, and the community's
                voice in shaping what we become together.
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

export function JoinUs() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  const [pageState, setPageState] = useState<'viewing' | 'qualifying' | 'applying'>('viewing');
  const [hasPassedQualificationCheck, setHasPassedQualificationCheck] = useState(false);
  const [qualificationData, setQualificationData] = useState<QualificationData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ahpra_registration: '',
    specializations: [],
    experience_years: 0,
    cover_letter: '',
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
    (type: 'cv' | 'certificate' | 'photo') => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFiles({ ...files, [type]: e.target.files[0] });
      }
    };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_ENDPOINTS.upload}?type=${type}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload files
      const cv_url = files.cv ? await uploadFile(files.cv, 'cv') : '';
      const certificate_url = files.certificate
        ? await uploadFile(files.certificate, 'certificate')
        : '';
      const photo_url = files.photo ? await uploadFile(files.photo, 'photo') : '';

      // Submit application - include all qualification check data
      const response = await fetch(API_ENDPOINTS.applications, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(error.error || 'Submission failed');
      }

      setSubmitted(true);
      toast({
        title: 'Application submitted!',
        description: "We'll review your application and be in touch soon.",
      });
    } catch {
      toast({
        title: "We're having a small hiccup",
        description:
          "Your application didn't quite make it through. Please check your connection and try again—we'd love to hear from you! 🌿",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #F0F9F3 0%, #FAF7F2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Garden illustration grows */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, ease: 'easeOut', type: 'spring', bounce: 0.4 }}
          style={{
            fontSize: isMobile ? '80px' : '120px',
            marginBottom: '24px',
          }}
        >
          🌺
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 600,
            color: '#3A3A3A',
            marginBottom: '16px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          Your Story is Planted
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            fontSize: isMobile ? '16px' : '18px',
            color: '#4A4A4A',
            textAlign: 'center',
            maxWidth: '500px',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          We'll nurture your application with care. Expect to hear from us.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSubmitted(false);
            setHasPassedQualificationCheck(false);
            setFormData({
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              ahpra_registration: '',
              specializations: [],
              experience_years: 0,
              cover_letter: '',
            });
            setFiles({ cv: null, certificate: null, photo: null });
          }}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: `2px solid ${bloomStyles.colors.eucalyptusSage}`,
            background: 'white',
            color: bloomStyles.colors.eucalyptusSage,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Return Home
        </motion.button>
      </motion.div>
    );
  }

  // Show qualification check when user clicks "Apply"
  if (pageState === 'qualifying' && !hasPassedQualificationCheck) {
    return (
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              fontSize: '18px',
              color: '#6B8E7F',
            }}
          >
            Loading...
          </div>
        }
      >
        <QualificationCheck
          onEligible={(data) => {
            setHasPassedQualificationCheck(true);
            setQualificationData(data);
            // Auto-populate experience years based on qualification
            setFormData((prev) => ({
              ...prev,
              experience_years: data.yearsRegistered >= 8 ? data.yearsRegistered : 0,
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
    <div
      style={{ position: 'relative', minHeight: '100vh', background: bloomStyles.colors.warmCream }}
    >
      {/* Ambient Background Layer - same as qualification check */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* Watercolor Blobs */}
        {[
          {
            size: '850px',
            color: bloomStyles.colors.eucalyptusSage,
            opacity: 0.08,
            top: '-20%',
            right: '-10%',
            blur: isMobile ? 100 : 150,
          },
          {
            size: '950px',
            color: bloomStyles.colors.softTerracotta,
            opacity: 0.05,
            bottom: '-25%',
            left: '-15%',
            blur: isMobile ? 110 : 160,
          },
          {
            size: '750px',
            color: bloomStyles.colors.paleAmber,
            opacity: 0.06,
            top: '40%',
            left: '-10%',
            blur: isMobile ? 120 : 180,
          },
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
              background: bloomStyles.colors.eucalyptusSage,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div
        style={{ position: 'relative', zIndex: 1, padding: isMobile ? '40px 16px' : '60px 24px' }}
      >
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

            <h1
              style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: 600,
                color: '#3A3A3A',
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
                marginBottom: '12px',
              }}
            >
              Apply to Join
            </h1>

            <p
              style={{
                fontSize: isMobile ? '15px' : '16px',
                lineHeight: 1.6,
                color: '#4A4A4A',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              Tell us about yourself and your practice. We'll review your application and get back
              to you.
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
                background: `linear-gradient(to bottom, #FFFFFF 0%, ${bloomStyles.colors.paperWhite} 100%)`,
                borderRadius: '12px',
                boxShadow: `0 4px 24px rgba(107, 142, 127, 0.08)`,
                border: `1px solid rgba(107, 142, 127, 0.15)`,
                position: 'relative',
              }}
            >
              {/* Paper Texture Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.03,
                  borderRadius: '12px',
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E\")",
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                }}
              />

              {/* Section: Personal Information */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginBottom: '32px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#3A3A3A',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Personal Information
                  </h2>
                </div>

                {/* Personal Information Fields */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <motion.div
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    viewport={{ once: true }}
                  >
                    <Label
                      htmlFor="first_name"
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#3A3A3A',
                        marginBottom: '8px',
                      }}
                    >
                      First Name <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                    </Label>
                    <Input
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Jane"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: `2px solid rgba(107, 142, 127, 0.3)`,
                        background: bloomStyles.colors.paperWhite,
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                    />
                  </motion.div>

                  <motion.div
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                  >
                    <Label
                      htmlFor="last_name"
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#3A3A3A',
                        marginBottom: '8px',
                      }}
                    >
                      Last Name <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                    </Label>
                    <Input
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Smith"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: `2px solid rgba(107, 142, 127, 0.3)`,
                        background: bloomStyles.colors.paperWhite,
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                    />
                  </motion.div>
                </div>

                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                  style={{ marginBottom: '16px' }}
                >
                  <Label
                    htmlFor="email"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    Email <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane.smith@email.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: `2px solid rgba(107, 142, 127, 0.3)`,
                      background: bloomStyles.colors.paperWhite,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                </motion.div>

                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                >
                  <Label
                    htmlFor="phone"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+61 400 000 000"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: `2px solid rgba(107, 142, 127, 0.3)`,
                      background: bloomStyles.colors.paperWhite,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Section: Professional Details */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginTop: '40px', marginBottom: '32px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#3A3A3A',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Professional Details
                  </h2>
                </div>

                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                  style={{ marginBottom: '16px' }}
                >
                  <Label
                    htmlFor="ahpra"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    AHPRA Registration Number{' '}
                    <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <Input
                    id="ahpra"
                    required
                    value={formData.ahpra_registration}
                    onChange={(e) =>
                      setFormData({ ...formData, ahpra_registration: e.target.value })
                    }
                    placeholder="PSY0001234567"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: `2px solid rgba(107, 142, 127, 0.3)`,
                      background: bloomStyles.colors.paperWhite,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                </motion.div>

                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                >
                  <Label
                    htmlFor="experience"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    Years of Experience{' '}
                    <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    required
                    min="0"
                    value={formData.experience_years || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })
                    }
                    placeholder="5"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: `2px solid rgba(107, 142, 127, 0.3)`,
                      background: bloomStyles.colors.paperWhite,
                      outline: 'none',
                      transition: 'all 0.2s',
                      cursor: 'text',
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Section: Cover Letter */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginTop: '40px', marginBottom: '32px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#3A3A3A',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Cover Letter
                  </h2>
                </div>

                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                >
                  <Label
                    htmlFor="cover_letter"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    Cover Letter <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <Textarea
                    id="cover_letter"
                    required
                    rows={6}
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    placeholder="Tell us about yourself, your practice philosophy, and why you're interested in joining Life Psychology Australia."
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      padding: '16px',
                      fontSize: '16px',
                      lineHeight: 1.6,
                      borderRadius: '8px',
                      border: `2px solid rgba(107, 142, 127, 0.3)`,
                      background: bloomStyles.colors.paperWhite,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Section: Documents */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginTop: '40px', marginBottom: '32px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#3A3A3A',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Documents
                  </h2>
                </div>

                {/* CV/Resume */}
                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                  style={{ marginBottom: '24px' }}
                >
                  <Label
                    htmlFor="cv"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    CV/Resume <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <div
                    onClick={() => document.getElementById('cv')?.click()}
                    style={{
                      border: `2px dashed rgba(107, 142, 127, 0.3)`,
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(107, 142, 127, 0.03)',
                      cursor: 'pointer',
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontSize: '32px', marginBottom: '12px' }}
                    >
                      📄
                    </motion.div>
                    <p
                      style={{
                        fontSize: '16px',
                        color: '#3A3A3A',
                        marginBottom: '8px',
                        fontWeight: 500,
                      }}
                    >
                      {files.cv ? files.cv.name : 'Choose file or drag here'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#5A5A5A' }}>PDF, DOC, DOCX (Max 10MB)</p>
                    <input
                      id="cv"
                      type="file"
                      required
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange('cv')}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </motion.div>

                {/* AHPRA Certificate */}
                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                  style={{ marginBottom: '24px' }}
                >
                  <Label
                    htmlFor="certificate"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    AHPRA Certificate{' '}
                    <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <div
                    onClick={() => document.getElementById('certificate')?.click()}
                    style={{
                      border: `2px dashed rgba(107, 142, 127, 0.3)`,
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(107, 142, 127, 0.03)',
                      cursor: 'pointer',
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                      style={{ fontSize: '32px', marginBottom: '12px' }}
                    >
                      📄
                    </motion.div>
                    <p
                      style={{
                        fontSize: '16px',
                        color: '#3A3A3A',
                        marginBottom: '8px',
                        fontWeight: 500,
                      }}
                    >
                      {files.certificate ? files.certificate.name : 'Choose file or drag here'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#5A5A5A' }}>PDF, JPG, PNG (Max 10MB)</p>
                    <input
                      id="certificate"
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange('certificate')}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </motion.div>

                {/* Professional Photo (Optional) */}
                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  viewport={{ once: true }}
                >
                  <Label
                    htmlFor="photo"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}
                  >
                    Professional Photo (Optional)
                  </Label>
                  <div
                    onClick={() => document.getElementById('photo')?.click()}
                    style={{
                      border: `2px dashed rgba(107, 142, 127, 0.3)`,
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(107, 142, 127, 0.03)',
                      cursor: 'pointer',
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                      style={{ fontSize: '32px', marginBottom: '12px' }}
                    >
                      📸
                    </motion.div>
                    <p
                      style={{
                        fontSize: '16px',
                        color: '#3A3A3A',
                        marginBottom: '8px',
                        fontWeight: 500,
                      }}
                    >
                      {files.photo ? files.photo.name : 'Choose file or drag here'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#5A5A5A' }}>JPG, PNG (Max 5MB)</p>
                    <input
                      id="photo"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange('photo')}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Submit Button - "Plant Your Application" */}
              <motion.button
                type="submit"
                disabled={uploading}
                whileHover={
                  !isMobile && !uploading
                    ? {
                        scale: 1.02,
                        boxShadow: `0 8px 28px rgba(107, 142, 127, 0.35)`,
                      }
                    : {}
                }
                whileTap={{ scale: uploading ? 1 : 0.98 }}
                style={{
                  width: '100%',
                  height: '56px',
                  minHeight: '48px',
                  background: uploading
                    ? `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage}80 0%, ${bloomStyles.colors.softFern}80 100%)`
                    : `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softFern} 100%)`,
                  color: bloomStyles.colors.paperWhite,
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
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(107, 142, 127, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
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
              stroke={bloomStyles.colors.eucalyptusSage}
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
            {completionPercentage < 33
              ? '🌱'
              : completionPercentage < 66
                ? '🌿'
                : completionPercentage < 100
                  ? '🌸'
                  : '🌺'}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
