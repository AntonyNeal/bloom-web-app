import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';

interface PsychologistApplication {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;

  // AHPRA Credentials
  ahpraNumber: string;
  ahpraExpiry: string;
  qualifications: string;
  institution: string;
  graduationYear: number;
  medicareProviderNumber?: string;
  isRegisteredClinicalPsychologist?: boolean;
  yearsRegisteredWithAHPRA?: number;
  hasPhD?: boolean;

  // Professional Experience
  yearsExperience: number;
  yearsOfExperience?: number;
  yearsOfExperienceAdults?: number;
  specialties: string[];
  clientTypes?: string[];
  otherSpecialties?: string;
  motivation: string;

  // Work Preferences
  currentWeeklyClientHours: number;
  lookingToReplaceOrSupplement:
    | 'replace-all'
    | 'replace-some'
    | 'supplement'
    | 'just-exploring';
  preferredClientTypes: string[];
  currentEmploymentStatus: string;
  availableStartDate: string;

  // Telehealth Setup
  state: string;
  timezone: string;
  hasTelehealthExperience?: boolean;
  telehealthExperienceYears?: number;
  telehealthCapable?: boolean;
  preferredPlatforms?: string[];
  sessionTypes?: string[];
  availability?: {
    days?: string[];
    earliestTime?: string;
    latestTime?: string;
  };
  hasReliableInternet: boolean;
  hasQuietPrivateSpace: boolean;
  hasWebcamAndHeadset: boolean;
  willingToAcceptMedicare?: boolean;
  willingToAcceptPrivateOnly?: boolean;

  // Insurance & Compliance
  hasInsurance: boolean;
  insuranceProvider?: string;
  hasWorkingWithChildrenCheck: boolean;
  workingWithChildrenNumber?: string;
  preferredHourlyRate?: number;

  // Professional References
  reference1Name: string;
  reference1Email: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Email: string;
  reference2Relationship: string;

  // File Uploads
  cvFile?: File;
  ahpraCertificateFile?: File;
  insuranceCertificateFile?: File;

  // Consent & Legal
  privacyConsent: boolean;
  backgroundCheckConsent: boolean;

  // Metadata
  applicationId?: string;
  submittedAt?: Date;
}

const httpTrigger = async (
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log(
    'Psychologist application submission function processed a request.'
  );

  try {
    // Parse the request body
    const applicationData = (await req.json()) as PsychologistApplication;

    if (!applicationData) {
      return {
        status: 400,
        jsonBody: { error: 'No application data provided' },
      };
    }

    // Generate application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    applicationData.applicationId = applicationId;
    applicationData.submittedAt = new Date();

    // Validate required fields
    const validationErrors = validateApplication(applicationData);
    if (validationErrors.length > 0) {
      return {
        status: 400,
        jsonBody: { error: 'Validation failed', details: validationErrors },
      };
    }

    // Handle file uploads to Azure Blob Storage
    const fileUrls = await handleFileUploads(
      context,
      applicationData,
      applicationId
    );

    // Store application data (in a real implementation, this would go to a database)
    // For now, we'll just log it and return success
    context.log(`Application submitted successfully: ${applicationId}`);
    context.log(`Files uploaded: ${Object.keys(fileUrls).length}`);

    // Send notification email (placeholder - would integrate with SendGrid)
    await sendNotificationEmail(applicationData);

    // Return success response
    return {
      status: 200,
      jsonBody: {
        success: true,
        applicationId: applicationId,
        message:
          "Application submitted successfully. We'll review your application and contact you within 5-7 business days.",
        fileUrls: fileUrls,
      },
    };
  } catch (error) {
    context.error('Error processing application submission:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' },
    };
  }
};

function validateApplication(data: PsychologistApplication): string[] {
  const errors: string[] = [];

  // Required personal information
  if (!data.fullName?.trim()) errors.push('Full name is required');
  if (!data.email?.trim()) errors.push('Email is required');
  if (!data.phone?.trim()) errors.push('Phone number is required');

  // AHPRA validation
  if (!data.ahpraNumber?.trim()) errors.push('AHPRA number is required');
  if (!data.ahpraExpiry) errors.push('AHPRA expiry date is required');
  if (!data.qualifications?.trim()) errors.push('Qualifications are required');
  if (!data.institution?.trim()) errors.push('Institution is required');
  if (!data.graduationYear) errors.push('Graduation year is required');

  // Qualification gate - must meet at least one criterion
  const meetsCriteria =
    data.isRegisteredClinicalPsychologist ||
    (data.yearsRegisteredWithAHPRA && data.yearsRegisteredWithAHPRA >= 8) ||
    data.hasPhD;

  if (!meetsCriteria) {
    errors.push(
      'Must be a registered Clinical Psychologist, have 8+ years AHPRA registration, or hold a PhD in Psychology'
    );
  }

  // Professional experience
  if (!data.yearsExperience && data.yearsExperience !== 0)
    errors.push('Years of experience is required');
  if (!data.specialties?.length)
    errors.push('At least one specialty is required');
  if (!data.motivation?.trim()) errors.push('Motivation statement is required');

  // Work preferences
  if (!data.currentWeeklyClientHours && data.currentWeeklyClientHours !== 0)
    errors.push('Current weekly client hours is required');
  if (!data.lookingToReplaceOrSupplement)
    errors.push('Work preference selection is required');
  if (!data.currentEmploymentStatus?.trim())
    errors.push('Current employment status is required');
  if (!data.availableStartDate) errors.push('Available start date is required');

  // Telehealth setup
  if (!data.state?.trim()) errors.push('State is required');
  if (!data.timezone?.trim()) errors.push('Timezone is required');

  // Insurance & compliance
  if (data.hasInsurance === undefined)
    errors.push('Insurance status is required');
  if (data.hasWorkingWithChildrenCheck === undefined)
    errors.push('Working with Children Check status is required');

  // References
  if (!data.reference1Name?.trim())
    errors.push('First reference name is required');
  if (!data.reference1Email?.trim())
    errors.push('First reference email is required');
  if (!data.reference1Relationship?.trim())
    errors.push('First reference relationship is required');
  if (!data.reference2Name?.trim())
    errors.push('Second reference name is required');
  if (!data.reference2Email?.trim())
    errors.push('Second reference email is required');
  if (!data.reference2Relationship?.trim())
    errors.push('Second reference relationship is required');

  // Consents
  if (!data.privacyConsent) errors.push('Privacy consent is required');
  if (!data.backgroundCheckConsent)
    errors.push('Background check consent is required');

  return errors;
}

async function handleFileUploads(
  context: InvocationContext,
  data: PsychologistApplication,
  applicationId: string
): Promise<Record<string, string>> {
  const fileUrls: Record<string, string> = {};
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    context.warn('Azure Storage connection string not configured');
    return fileUrls;
  }

  try {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerName = 'applications';
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists({ access: 'blob' });

    const files = [
      { key: 'cvFile', file: data.cvFile, name: 'cv' },
      {
        key: 'ahpraCertificateFile',
        file: data.ahpraCertificateFile,
        name: 'ahpra-certificate',
      },
      {
        key: 'insuranceCertificateFile',
        file: data.insuranceCertificateFile,
        name: 'insurance-certificate',
      },
    ];

    for (const fileInfo of files) {
      if (fileInfo.file) {
        const blobName = `${applicationId}/${fileInfo.name}-${Date.now()}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // In a real implementation, you'd upload the actual file content
        // For now, we'll just create a placeholder
        const fileContent = `Placeholder for ${fileInfo.name} file`;
        await blockBlobClient.upload(fileContent, fileContent.length);

        fileUrls[fileInfo.key] = blockBlobClient.url;
        context.log(`Uploaded ${fileInfo.key} to ${blobName}`);
      }
    }
  } catch (error) {
    context.error('Error uploading files:', error);
    // Don't fail the application submission if file upload fails
  }

  return fileUrls;
}

async function sendNotificationEmail(
  data: PsychologistApplication
): Promise<void> {
  // Placeholder for email notification
  // In a real implementation, this would use SendGrid or similar service
  console.log(
    `Sending notification email for application ${data.applicationId} to admin`
  );

  // Example email content:
  // To: admin@life-psychology.com.au
  // Subject: New Psychologist Application Received
  // Body: Application details...
}

app.http('submitApplication', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'applications/submit',
  handler: httpTrigger,
});
