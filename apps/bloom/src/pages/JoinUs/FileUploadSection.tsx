import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Tier1Flower } from '@/components/flowers';
import { colors } from '@/design-system/tokens';

const bloomColors = colors.bloom;

interface FileUploadSectionProps {
  isMobile: boolean;
  files: {
    cv: File | null;
    certificate: File | null;
    photo: File | null;
  };
  onFileChange: (type: 'cv' | 'certificate' | 'photo') => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface FileUploadCardProps {
  id: string;
  label: string;
  required?: boolean;
  accept: string;
  maxSize: string;
  icon: string;
  animationDelay?: number;
  fileName: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FileUploadCard({
  id,
  label,
  required = false,
  accept,
  maxSize,
  icon,
  animationDelay = 0,
  fileName,
  onChange,
}: FileUploadCardProps) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      viewport={{ once: true }}
      style={{ marginBottom: '24px' }}
    >
      <Label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#3A3A3A',
          marginBottom: '8px',
        }}
      >
        {label}{' '}
        {required && <span style={{ color: bloomColors.clayTerracotta }}>*</span>}
      </Label>
      <div
        onClick={() => document.getElementById(id)?.click()}
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
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: animationDelay }}
          style={{ fontSize: '32px', marginBottom: '12px' }}
        >
          {icon}
        </motion.div>
        <p style={{ fontSize: '16px', color: '#3A3A3A', marginBottom: '8px', fontWeight: 500 }}>
          {fileName || 'Choose file or drag here'}
        </p>
        <p style={{ fontSize: '14px', color: '#5A5A5A' }}>{maxSize}</p>
        <input
          id={id}
          type="file"
          required={required}
          accept={accept}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
      </div>
    </motion.div>
  );
}

export function FileUploadSection({ isMobile, files, onFileChange }: FileUploadSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      style={{ marginTop: '40px', marginBottom: '32px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
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
      <FileUploadCard
        id="cv"
        label="CV/Resume"
        required
        accept=".pdf,.doc,.docx"
        maxSize="PDF, DOC, DOCX (Max 10MB)"
        icon="📄"
        animationDelay={0}
        fileName={files.cv?.name || null}
        onChange={onFileChange('cv')}
      />

      {/* AHPRA Certificate */}
      <FileUploadCard
        id="certificate"
        label="AHPRA Certificate"
        required
        accept=".pdf,.jpg,.jpeg,.png"
        maxSize="PDF, JPG, PNG (Max 10MB)"
        icon="📄"
        animationDelay={0.3}
        fileName={files.certificate?.name || null}
        onChange={onFileChange('certificate')}
      />

      {/* Professional Photo (Optional) */}
      <FileUploadCard
        id="photo"
        label="Professional Photo (Optional)"
        accept=".jpg,.jpeg,.png"
        maxSize="JPG, PNG (Max 5MB)"
        icon="📸"
        animationDelay={0.6}
        fileName={files.photo?.name || null}
        onChange={onFileChange('photo')}
      />
    </motion.div>
  );
}
