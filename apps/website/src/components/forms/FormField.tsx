import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'time';
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  rows?: number; // For textarea
  min?: number; // For number inputs
  max?: number; // For number inputs
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  helpText,
  rows = 6,
  min,
  max,
}) => {
  const baseInputClasses =
    'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  const normalBorderClasses = 'border-gray-300';
  const errorBorderClasses = 'border-red-300 bg-red-50';

  const inputClasses = `${baseInputClasses} ${error ? errorBorderClasses : normalBorderClasses}`;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue =
      type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-gray-700 font-semibold mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
          required={required}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
          min={type === 'number' ? min : undefined}
          max={type === 'number' ? max : undefined}
        />
      )}

      {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mt-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
