import axios, { AxiosError } from 'axios';
import { getEnvVar } from '../utils/env';
import { PsychologistApplication } from '../types/psychologist';

// Get Azure Functions base URL from environment (single source of truth)
// VITE_API_URL includes /api suffix, strip it to get base URL
const apiUrl = getEnvVar('VITE_API_URL') || 'https://bloom-functions-staging-new.azurewebsites.net/api';
const FUNCTIONS_BASE_URL = apiUrl.replace(/\/api$/, '');

/**
 * Response from the SAS token endpoint
 */
export interface SasTokenResponse {
  sasUrl: string;
  expiresAt?: string;
}

/**
 * Response from the application submission endpoint
 */
export interface ApplicationSubmissionResponse {
  id: string;
  status: 'received' | 'pending' | 'reviewing';
  submittedAt: string;
  message?: string;
}

/**
 * Error response structure from Azure Functions
 */
interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: Record<string, string>;
}

/**
 * Custom error class for application API errors
 */
export class ApplicationApiError extends Error {
  public statusCode?: number;
  public details?: Record<string, string>;

  constructor(
    message: string,
    statusCode?: number,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApplicationApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Upload a document to Azure Blob Storage using SAS token
 *
 * @param file - The file to upload
 * @param fileType - The MIME type of the file (e.g., 'application/pdf')
 * @returns The blob URL (without SAS token) where the file is stored
 * @throws ApplicationApiError if upload fails
 */
export async function uploadDocument(
  file: File,
  fileType: string
): Promise<string> {
  try {
    // Step 1: Get SAS token from Azure Functions
    const tokenResponse = await axios.get<SasTokenResponse>(
      `${FUNCTIONS_BASE_URL}/api/applications/get-sas-token`,
      {
        params: {
          fileType: fileType,
          fileName: file.name,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (!tokenResponse.data.sasUrl) {
      throw new ApplicationApiError(
        'Failed to get upload token from server',
        500
      );
    }

    const { sasUrl } = tokenResponse.data;

    // Step 2: Upload file directly to Azure Blob Storage using SAS URL
    await axios.put(sasUrl, file, {
      headers: {
        'Content-Type': fileType,
        'x-ms-blob-type': 'BlockBlob',
      },
      timeout: 60000, // 60 second timeout for file upload
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          // Could emit events here for progress UI
        }
      },
    });

    // Step 3: Extract the blob URL (without SAS token) to store in database
    const blobUrl = sasUrl.split('?')[0];
    return blobUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        // Server responded with error
        const errorMessage =
          axiosError.response.data?.error ||
          axiosError.response.data?.message ||
          `Upload failed with status ${axiosError.response.status}`;

        throw new ApplicationApiError(
          errorMessage,
          axiosError.response.status,
          axiosError.response.data?.details
        );
      } else if (axiosError.request) {
        // Request made but no response
        throw new ApplicationApiError(
          'Unable to connect to upload server. Please check your internet connection.',
          0
        );
      }
    }

    // Unknown error
    throw new ApplicationApiError(
      error instanceof Error ? error.message : 'Unknown upload error occurred',
      500
    );
  }
}

/**
 * Submit a complete psychologist application
 *
 * @param data - The application form data
 * @returns Application submission response with ID
 * @throws ApplicationApiError if submission fails
 */
export async function submitApplication(
  data: PsychologistApplication
): Promise<ApplicationSubmissionResponse> {
  try {
    // Step 1: Upload all documents first
    const uploadPromises: Promise<string | null>[] = [];
    const documentTypes: (
      | 'cvFile'
      | 'ahpraCertificateFile'
      | 'insuranceCertificateFile'
    )[] = [];

    // Upload resume/CV
    if (data.cvFile instanceof File) {
      uploadPromises.push(uploadDocument(data.cvFile, data.cvFile.type));
      documentTypes.push('cvFile');
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    // Upload AHPRA certificate
    if (data.ahpraCertificateFile instanceof File) {
      uploadPromises.push(
        uploadDocument(
          data.ahpraCertificateFile,
          data.ahpraCertificateFile.type
        )
      );
      documentTypes.push('ahpraCertificateFile');
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    // Upload insurance certificate
    if (data.insuranceCertificateFile instanceof File) {
      uploadPromises.push(
        uploadDocument(
          data.insuranceCertificateFile,
          data.insuranceCertificateFile.type
        )
      );
      documentTypes.push('insuranceCertificateFile');
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    // Wait for all uploads to complete
    console.log('Uploading documents...');
    const uploadResults = await Promise.all(uploadPromises);

    // Step 2: Replace File objects with blob URLs
    const submissionData = {
      ...data,
      cvFile: uploadResults[0] || data.cvFile,
      ahpraCertificateFile: uploadResults[1] || data.ahpraCertificateFile,
      insuranceCertificateFile:
        uploadResults[2] || data.insuranceCertificateFile,
      submittedAt: new Date(),
    };

    // Remove any File objects that might still be in the data
    const cleanData = JSON.parse(
      JSON.stringify(submissionData, (_key, value) => {
        // Skip File objects in serialization
        if (value instanceof File) {
          return undefined;
        }
        return value;
      })
    );

    // Step 3: Submit application data to Azure Functions
    console.log('Submitting application...');
    const response = await axios.post<ApplicationSubmissionResponse>(
      `${FUNCTIONS_BASE_URL}/api/applications/submit`,
      cleanData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (!response.data.id) {
      throw new ApplicationApiError(
        'Server did not return an application ID',
        500
      );
    }

    return response.data;
  } catch (error) {
    // If it's already an ApplicationApiError from uploadDocument, re-throw it
    if (error instanceof ApplicationApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        // Server responded with error
        const errorMessage =
          axiosError.response.data?.error ||
          axiosError.response.data?.message ||
          `Submission failed with status ${axiosError.response.status}`;

        throw new ApplicationApiError(
          errorMessage,
          axiosError.response.status,
          axiosError.response.data?.details
        );
      } else if (axiosError.request) {
        // Request made but no response
        throw new ApplicationApiError(
          'Unable to connect to application server. Please check your internet connection.',
          0
        );
      }
    }

    // Unknown error
    throw new ApplicationApiError(
      error instanceof Error
        ? error.message
        : 'Unknown error occurred during submission',
      500
    );
  }
}

/**
 * Helper function to get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApplicationApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
