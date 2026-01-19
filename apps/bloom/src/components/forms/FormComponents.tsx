import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
  icon?: ReactNode;
}

/**
 * Reusable form field component with consistent Bloom styling
 * Reduces duplication across JoinUs and other forms
 */
export function FormField({ 
  label, 
  htmlFor, 
  required, 
  helper, 
  error,
  children,
  icon 
}: FormFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        {icon && <div className="w-5 h-5">{icon}</div>}
        <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      
      {children}
      
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </motion.div>
  );
}

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  helper?: string;
  error?: string;
  icon?: ReactNode;
}

/**
 * Pre-configured text input with FormField wrapper
 */
export function TextInput({ 
  id, 
  label, 
  value, 
  onChange, 
  required,
  placeholder,
  type = 'text',
  helper,
  error,
  icon
}: TextInputProps) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      helper={helper}
      error={error}
      icon={icon}
    >
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="transition-all duration-200"
      />
    </FormField>
  );
}

interface TextAreaInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  helper?: string;
  error?: string;
  icon?: ReactNode;
}

/**
 * Pre-configured textarea with FormField wrapper
 */
export function TextAreaInput({ 
  id, 
  label, 
  value, 
  onChange, 
  required,
  placeholder,
  rows = 4,
  helper,
  error,
  icon
}: TextAreaInputProps) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      helper={helper}
      error={error}
      icon={icon}
    >
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="transition-all duration-200 resize-none"
      />
    </FormField>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Form section with consistent heading and spacing
 */
export function FormSection({ title, description, icon, children }: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        {icon && <div className="w-6 h-6">{icon}</div>}
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
