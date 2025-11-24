import React, { useState, useRef } from 'react';

interface FileUploadProps {
  label: string;
  name: string;
  accept: string; // e.g., ".pdf,.doc,.docx"
  maxSizeMB: number;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
  helpText?: string;
  currentFileName?: string; // For showing already uploaded file
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  accept,
  maxSizeMB,
  onChange,
  error,
  required = false,
  helpText,
  currentFileName,
}) => {
  const [fileName, setFileName] = useState<string>(currentFileName || '');
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract allowed extensions from accept prop
  const allowedExtensions = accept
    .split(',')
    .map((ext) => ext.trim().toLowerCase());

  const validateFile = (file: File): boolean => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      const errorMsg = `Invalid file type. Please upload ${accept.replace(/\./g, '').toUpperCase()} files only`;
      setValidationError(errorMsg);
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const errorMsg = `File size must be less than ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(1)}MB`;
      setValidationError(errorMsg);
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setFileName('');
      onChange(null);
      return;
    }

    if (validateFile(file)) {
      setFileName(file.name);
      onChange(file);
    } else {
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileName('');
      onChange(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAreaClasses = `border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
    isDragging
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-300 hover:border-blue-500'
  }`;

  return (
    <div className="mb-6">
      <label
        htmlFor={`file-${name}`}
        className="block text-gray-700 font-semibold mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        ref={fileInputRef}
        id={`file-${name}`}
        name={name}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        required={required}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={uploadAreaClasses}
      >
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-gray-700 font-medium">{fileName}</span>
            <span className="text-gray-500 text-sm">(Click to change)</span>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {accept.toUpperCase().replace(/\./g, '')} files up to {maxSizeMB}
              MB
            </p>
          </div>
        )}
      </div>

      {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}

      {(error || validationError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mt-2 text-sm">
          {error || validationError}
        </div>
      )}
    </div>
  );
};
