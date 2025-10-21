import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";
import { motion, useReducedMotion } from "framer-motion";
import { Tier1Flower, Tier2Flower, Tier3Flower } from "@/components/flowers";
import type { QualificationData } from "@/components/common/QualificationCheck";

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

// Marketing Content Component - Bloom-aligned copy
function MarketingContent({ isMobile, onApplyClick }: { isMobile: boolean; onApplyClick: () => void }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: bloomStyles.colors.warmCream }}>
      {/* Ambient Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[
          { size: '850px', color: bloomStyles.colors.eucalyptusSage, opacity: 0.06, top: '-15%', right: '-8%', blur: 140 },
          { size: '950px', color: bloomStyles.colors.softTerracotta, opacity: 0.04, bottom: '-20%', left: '-12%', blur: 150 },
        ].map((blob, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: blob.opacity, scale: [1, 1.02, 1] }}
            transition={{
              opacity: { duration: 0.8, delay: i * 0.2 },
              scale: { duration: 50 + i * 10, repeat: Infinity, ease: 'easeInOut' },
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
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '40px 20px' : '80px 40px' }}>
        
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: isMobile ? '60px' : '100px' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'inline-block',
              marginBottom: '20px',
            }}
          >
            <h1 style={{
              fontSize: isMobile ? '40px' : '56px',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softTerracotta} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              Practice Your Way
            </h1>
          </motion.div>
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
            <strong>No need to quit your current job.</strong> Bloom can supplement your income or become your full-time career—your choice. Work completely on your schedule: weekends, evenings, early mornings, or business hours.<br />
            <strong>Bloom fits into your life, not the other way around.</strong>
          </motion.p>
        </motion.section>

        {/* Value Props - 3 Cards */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ marginBottom: isMobile ? '80px' : '120px' }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px',
          }}>
            {[
              {
                title: 'You keep 80%',
                icon: '💰',
                accentColor: bloomStyles.colors.eucalyptusSage,
                description: 'Most practices take 40-50%. We take 20%.\nYou do the work. You get paid fairly.',
              },
              {
                title: 'We use Halaxy',
                icon: '🔧',
                accentColor: bloomStyles.colors.softTerracotta,
                description: 'Practice management through Halaxy.\nBooking, billing, notes—all in one place.',
              },
              {
                title: 'Build your own practice',
                icon: '🌿',
                accentColor: bloomStyles.colors.honeyAmber,
                description: 'Your schedule. Your clients. Your specialties.\nSee one client a week or thirty—you decide.\nSupplement your current income or go full-time.\nPick up appointments anytime: early mornings, weekends, evenings.\nCompletely flexible. You make it yours.',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(107, 142, 127, 0.15)' }}
                style={{
                  padding: isMobile ? '32px 24px' : '40px 32px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  border: `2px solid ${card.accentColor}30`,
                  boxShadow: '0 4px 12px rgba(107, 142, 127, 0.08)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative corner accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '80px',
                  height: '80px',
                  background: `radial-gradient(circle at top right, ${card.accentColor}15, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
                
                <div style={{ fontSize: '36px', marginBottom: '16px', lineHeight: 1 }}>
                  {card.icon}
                </div>
                
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: card.accentColor,
                  marginBottom: '12px',
                  lineHeight: 1.3,
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: '#4A4A4A',
                  whiteSpace: 'pre-line',
                }}>
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* What's Included Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ marginBottom: isMobile ? '80px' : '120px' }}
        >
          <h2 style={{
            fontSize: isMobile ? '32px' : '40px',
            fontWeight: 600,
            color: '#3A3A3A',
            textAlign: 'center',
            marginBottom: isMobile ? '40px' : '60px',
            letterSpacing: '-0.02em',
          }}>
            What's Included
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '24px' : '32px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>
            {[
              {
                heading: 'The Money',
                flowerType: 'tier1', // Cherry blossom
                accentColor: bloomStyles.colors.eucalyptusSage,
                items: [
                  '80% of what you bill goes to you',
                  '$250 session = $200 to you',
                ],
              },
              {
                heading: 'The Platform',
                flowerType: 'tier2', // Rose
                accentColor: bloomStyles.colors.softFern,
                items: [
                  'Halaxy for practice management',
                  'Video sessions, booking, billing',
                  'Clinical notes and reminders',
                ],
              },
              {
                heading: 'Bloom',
                flowerType: 'tier3', // Daisy
                accentColor: bloomStyles.colors.softTerracotta,
                items: [
                  'Track your professional development',
                  'Access supervision and training',
                  'Medicare renewal reminders and insurance processing',
                ],
              },
              {
                heading: 'The Marketing',
                flowerType: 'tier1', // Cherry blossom
                accentColor: bloomStyles.colors.honeyAmber,
                items: [
                  'We bring you clients',
                  'Professional website presence',
                ],
              },
              {
                heading: 'The Freedom',
                flowerType: 'tier2', // Rose
                accentColor: bloomStyles.colors.clayTerracotta,
                items: [
                  'Work from anywhere in Australia',
                  'Set your own hours and rates',
                  'No quotas or billing targets',
                  'No lock-in contracts',
                ],
              },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(107, 142, 127, 0.14)' }}
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                padding: isMobile ? '28px 24px' : '36px 32px',
                borderRadius: '20px',
                border: `1.5px solid ${section.accentColor}25`,
                boxShadow: '0 4px 16px rgba(107, 142, 127, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'visible', // Let flowers grow out of the box
                // Center the last card (Freedom) in the grid
                ...(i === 4 && !isMobile && { gridColumn: '1 / -1', maxWidth: '480px', margin: '0 auto', width: '100%' }),
              }}
              >
                {/* Subtle accent strip */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${section.accentColor}, transparent)`,
                  opacity: 0.4,
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ width: '32px', height: '32px', position: 'relative', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                    {section.flowerType === 'tier1' && <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />}
                    {section.flowerType === 'tier2' && <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />}
                    {section.flowerType === 'tier3' && <Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />}
                  </div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: section.accentColor,
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}>
                    {section.heading}
                  </h3>
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{
                      fontSize: '15px',
                      lineHeight: 1.7,
                      color: '#4A4A4A',
                      paddingLeft: '24px',
                      position: 'relative',
                      marginBottom: j < section.items.length - 1 ? '12px' : 0,
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: section.accentColor,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        lineHeight: 1,
                      }}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* The Approach Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              marginTop: isMobile ? '48px' : '80px',
              padding: isMobile ? '40px 28px' : '56px 48px',
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 247, 242, 0.9) 100%)`,
              borderRadius: '24px',
              textAlign: 'center',
              maxWidth: '700px',
              margin: `${isMobile ? '48px' : '80px'} auto 0`,
              border: `2px solid ${bloomStyles.colors.eucalyptusSage}20`,
              boxShadow: '0 8px 32px rgba(107, 142, 127, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${bloomStyles.colors.softTerracotta}15, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '-40px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${bloomStyles.colors.eucalyptusSage}12, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{
                fontSize: isMobile ? '26px' : '32px',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softTerracotta} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '24px',
                letterSpacing: '-0.02em',
              }}>
                How We Work
              </h3>
              <div style={{
                fontSize: isMobile ? '17px' : '19px',
                lineHeight: 1.9,
                color: '#3A3A3A',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <p style={{ margin: 0, fontWeight: 500 }}>Fair compensation. Halaxy for operations. Marketing support.</p>
                <p style={{ margin: 0, fontWeight: 500 }}>Community-driven direction.</p>
                <p style={{ 
                  margin: '16px 0 0 0', 
                  color: bloomStyles.colors.eucalyptusSage,
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  fontStyle: 'italic',
                }}>
                  Let's build a sustainable practice and make good money doing it.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Qualification Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            marginBottom: isMobile ? '80px' : '120px',
            textAlign: 'center',
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              fontSize: isMobile ? '32px' : '40px',
              fontWeight: 700,
              color: bloomStyles.colors.eucalyptusSage,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            Who We're Looking For
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '18px',
              color: '#4A4A4A',
              marginBottom: '40px',
            }}
          >
            To apply, you need at least one of these:
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            style={{
              maxWidth: '650px',
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: isMobile ? '36px 28px' : '48px',
              borderRadius: '20px',
              border: `1.5px solid ${bloomStyles.colors.eucalyptusSage}25`,
              boxShadow: '0 6px 24px rgba(107, 142, 127, 0.1)',
            }}
          >
            {[
              'Registered Clinical Psychologist (AHPRA)',
              '8+ years Registered Psychologist (AHPRA)',
              'PhD in Psychology with AHPRA registration',
            ].map((req, i) => (
              <p key={i} style={{
                fontSize: '18px',
                lineHeight: 1.8,
                color: '#3A3A3A',
                marginBottom: i < 2 ? '16px' : 0,
              }}>
                {req}
              </p>
            ))}
          </motion.div>
        </motion.section>

        {/* Founder Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ marginBottom: isMobile ? '80px' : '120px' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              maxWidth: '850px',
              margin: '0 auto',
              padding: isMobile ? '44px 28px' : '64px 56px',
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 247, 242, 0.85) 100%)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              border: `2px solid ${bloomStyles.colors.eucalyptusSage}20`,
              boxShadow: '0 8px 32px rgba(107, 142, 127, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${bloomStyles.colors.eucalyptusSage}, ${bloomStyles.colors.softTerracotta})`,
              opacity: 0.5,
            }} />
            
            <h2 style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: 700,
              color: bloomStyles.colors.eucalyptusSage,
              marginBottom: '28px',
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}>
              Why This Exists
            </h2>
            <div style={{
              fontSize: isMobile ? '16px' : '17px',
              lineHeight: 1.9,
              color: '#3A3A3A',
            }}>
              <p style={{ marginBottom: '24px' }}>
                I'm Zoe Semmler, a clinical psychologist. I started this because
                I kept watching talented colleagues burn out—not because they
                stopped caring, but because the traditional practice model didn't work for them.
              </p>
              <blockquote style={{
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
              }}>
                "What if psychologists kept most of what they earned, we provided the technology 
                for a more human-centred practice, and we brought them clients?"
              </blockquote>
              <p style={{ marginBottom: '24px', fontSize: isMobile ? '17px' : '18px', fontWeight: 500 }}>
                That's the premise. Fair pay. Halaxy for operations. Marketing support.
              </p>
              <p style={{ fontSize: isMobile ? '16px' : '17px' }}>
                This practice is built on respect—for your expertise, your time,
                and the community's voice in shaping what we become together.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', paddingBottom: isMobile ? '60px' : '100px' }}
        >
          <h2 style={{
            fontSize: isMobile ? '32px' : '40px',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softTerracotta} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}>
            Interested?
          </h2>
          <p style={{
            fontSize: isMobile ? '17px' : '19px',
            color: '#4A4A4A',
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px',
            lineHeight: 1.7,
          }}>
            If this approach makes sense to you,<br />
            let's see if you qualify.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 28px rgba(107, 142, 127, 0.35)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onApplyClick}
            style={{
              padding: isMobile ? '18px 44px' : '20px 56px',
              fontSize: isMobile ? '17px' : '19px',
              fontWeight: 700,
              color: '#FEFDFB',
              background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softFern} 100%)`,
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(107, 142, 127, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            Begin Application
          </motion.button>
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
          We'll nurture your application with care. 
          Expect to hear from us within 5-7 days.
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
    <div style={{ position: 'relative', minHeight: '100vh', background: bloomStyles.colors.warmCream }}>
      {/* Ambient Background Layer - same as qualification check */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Watercolor Blobs */}
        {[
          { size: '850px', color: bloomStyles.colors.eucalyptusSage, opacity: 0.08, top: '-20%', right: '-10%', blur: isMobile ? 100 : 150 },
          { size: '950px', color: bloomStyles.colors.softTerracotta, opacity: 0.05, bottom: '-25%', left: '-15%', blur: isMobile ? 110 : 160 },
          { size: '750px', color: bloomStyles.colors.paleAmber, opacity: 0.06, top: '40%', left: '-10%', blur: isMobile ? 120 : 180 },
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
                background: `linear-gradient(to bottom, #FFFFFF 0%, ${bloomStyles.colors.paperWhite} 100%)`,
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
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginBottom: '32px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#3A3A3A',
                    letterSpacing: '-0.01em',
                  }}>
                    Personal Information
                  </h2>
                </div>

                {/* Personal Information Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }}>
                    <Label htmlFor="first_name" style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}>
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

                  <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
                    <Label htmlFor="last_name" style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#3A3A3A',
                      marginBottom: '8px',
                    }}>
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

                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} style={{ marginBottom: '16px' }}>
                  <Label htmlFor="email" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
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

                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }}>
                  <Label htmlFor="phone" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
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
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginTop: '40px', marginBottom: '32px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#3A3A3A',
                    letterSpacing: '-0.01em',
                  }}>
                    Professional Details
                  </h2>
                </div>

                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} style={{ marginBottom: '16px' }}>
                  <Label htmlFor="ahpra" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
                    AHPRA Registration Number <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <Input
                    id="ahpra"
                    required
                    value={formData.ahpra_registration}
                    onChange={(e) => setFormData({ ...formData, ahpra_registration: e.target.value })}
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

                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }}>
                  <Label htmlFor="experience" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
                    Years of Experience <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    required
                    min="0"
                    value={formData.experience_years || ""}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    readOnly={qualificationData?.qualificationType === 'clinical' || qualificationData?.qualificationType === 'phd'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: `2px solid rgba(107, 142, 127, 0.3)`,
                      background: qualificationData?.qualificationType === 'clinical' || qualificationData?.qualificationType === 'phd' 
                        ? 'rgba(107, 142, 127, 0.05)' 
                        : bloomStyles.colors.paperWhite,
                      outline: 'none',
                      transition: 'all 0.2s',
                      cursor: qualificationData?.qualificationType === 'clinical' || qualificationData?.qualificationType === 'phd' 
                        ? 'not-allowed' 
                        : 'text',
                    }}
                  />
                  {qualificationData && (qualificationData.qualificationType === 'clinical' || qualificationData.qualificationType === 'phd') && (
                    <p style={{ 
                      fontSize: '12px', 
                      color: bloomStyles.colors.eucalyptusSage, 
                      marginTop: '4px' 
                    }}>
                      Not required for your qualification.
                    </p>
                  )}
                </motion.div>
              </motion.div>

              {/* Section: Cover Letter */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginTop: '40px', marginBottom: '32px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#3A3A3A',
                    letterSpacing: '-0.01em',
                  }}>
                    Cover Letter
                  </h2>
                </div>

                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }}>
                  <Label htmlFor="cover_letter" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
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
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{ marginTop: '40px', marginBottom: '32px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '24px', height: '24px', position: 'relative' }}>
                    <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
                  </div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#3A3A3A',
                    letterSpacing: '-0.01em',
                  }}>
                    Documents
                  </h2>
                </div>

                {/* CV/Resume */}
                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} style={{ marginBottom: '24px' }}>
                  <Label htmlFor="cv" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
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
                    <p style={{ fontSize: '16px', color: '#3A3A3A', marginBottom: '8px', fontWeight: 500 }}>
                      {files.cv ? files.cv.name : 'Choose file or drag here'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#5A5A5A' }}>
                      PDF, DOC, DOCX (Max 10MB)
                    </p>
                    <input
                      id="cv"
                      type="file"
                      required
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange("cv")}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </motion.div>

                {/* AHPRA Certificate */}
                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} style={{ marginBottom: '24px' }}>
                  <Label htmlFor="certificate" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
                    AHPRA Certificate <span style={{ color: bloomStyles.colors.clayTerracotta }}>*</span>
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
                    <p style={{ fontSize: '16px', color: '#3A3A3A', marginBottom: '8px', fontWeight: 500 }}>
                      {files.certificate ? files.certificate.name : 'Choose file or drag here'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#5A5A5A' }}>
                      PDF, JPG, PNG (Max 10MB)
                    </p>
                    <input
                      id="certificate"
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange("certificate")}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </motion.div>

                {/* Professional Photo (Optional) */}
                <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }}>
                  <Label htmlFor="photo" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3A3A3A',
                    marginBottom: '8px',
                  }}>
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
                    <p style={{ fontSize: '16px', color: '#3A3A3A', marginBottom: '8px', fontWeight: 500 }}>
                      {files.photo ? files.photo.name : 'Choose file or drag here'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#5A5A5A' }}>
                      JPG, PNG (Max 5MB)
                    </p>
                    <input
                      id="photo"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange("photo")}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </motion.div>
              </motion.div>

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
            {completionPercentage < 33 ? '🌱' : 
             completionPercentage < 66 ? '🌿' : 
             completionPercentage < 100 ? '🌸' : '🌺'}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}