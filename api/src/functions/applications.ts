import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { emailService } from '../services/email';
import { practitionerService } from '../services/practitioner';

// Support both connection string and individual credentials
const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;

  if (connectionString) {
    return connectionString;
  }

  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
};

async function applicationsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const method = req.method;
  const id = req.params.id;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (method === 'OPTIONS') {
    return { status: 204, headers };
  }

  try {
    const config = getConfig();
    const pool = await sql.connect(config);

    if (method === 'GET' && !id) {
      context.log('Fetching all applications');
      const result = await pool
        .request()
        .query('SELECT * FROM applications ORDER BY created_at DESC');

      return {
        status: 200,
        headers,
        jsonBody: result.recordset,
      };
    }

    if (method === 'GET' && id) {
      context.log(`Fetching application ${id}`);
      const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM applications WHERE id = @id');

      if (result.recordset.length === 0) {
        return {
          status: 404,
          headers,
          jsonBody: { error: 'Application not found' },
        };
      }

      return {
        status: 200,
        headers,
        jsonBody: result.recordset[0],
      };
    }

    if (method === 'POST') {
      context.log('Creating new application');
      const body = (await req.json()) as {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        ahpra_registration: string;
        specializations: string[];
        experience_years?: number;
        cv_url?: string;
        certificate_url?: string;
        photo_url?: string;
        cover_letter?: string;
        qualification_type?: string;
        qualification_check?: unknown;
      };
      const {
        first_name,
        last_name,
        email,
        phone,
        ahpra_registration,
        specializations,
        experience_years,
        cv_url,
        certificate_url,
        photo_url,
        cover_letter,
        qualification_type,
        qualification_check,
      } = body;

      // Log the qualification data for debugging (will be stored once DB is updated)
      if (qualification_type || qualification_check) {
        context.log('Qualification data received (not stored yet):', {
          qualification_type,
          qualification_check,
        });
      }

      if (!first_name || !last_name || !email || !ahpra_registration) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'Missing required fields' },
        };
      }

      const result = await pool
        .request()
        .input('first_name', sql.NVarChar, first_name)
        .input('last_name', sql.NVarChar, last_name)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, phone || null)
        .input('ahpra_registration', sql.NVarChar, ahpra_registration)
        .input(
          'specializations',
          sql.NVarChar,
          specializations ? JSON.stringify(specializations) : null
        )
        .input('experience_years', sql.Int, experience_years || 0)
        .input('cv_url', sql.NVarChar, cv_url || null)
        .input('certificate_url', sql.NVarChar, certificate_url || null)
        .input('photo_url', sql.NVarChar, photo_url || null)
        .input('cover_letter', sql.NVarChar, cover_letter || null)
        .input('qualification_type', sql.NVarChar, qualification_type || null)
        .input(
          'qualification_check',
          sql.NVarChar,
          qualification_check ? JSON.stringify(qualification_check) : null
        ).query(`
          INSERT INTO applications (
            first_name, last_name, email, phone, ahpra_registration,
            specializations, experience_years, cv_url, certificate_url,
            photo_url, cover_letter, qualification_type, qualification_check
          )
          OUTPUT INSERTED.*
          VALUES (
            @first_name, @last_name, @email, @phone, @ahpra_registration,
            @specializations, @experience_years, @cv_url, @certificate_url,
            @photo_url, @cover_letter, @qualification_type, @qualification_check
          )
        `);

      return {
        status: 201,
        headers,
        jsonBody: result.recordset[0],
      };
    }

    if (method === 'PUT' && id) {
      context.log(`Updating application ${id}`);
      const body = (await req.json()) as {
        status?: string;
        reviewed_by?: string;
        admin_notes?: string;
        interview_scheduled_at?: string;
        interview_notes?: string;
        decision_reason?: string;
        contract_url?: string;
      };
      const { status, reviewed_by, admin_notes, interview_scheduled_at, interview_notes, decision_reason, contract_url } = body;

      // If only contract_url is provided, do a simple update without status validation
      if (contract_url && !status) {
        context.log(`Updating contract_url for application ${id}`);
        const result = await pool.request()
          .input('id', sql.Int, id)
          .input('contract_url', sql.NVarChar, contract_url)
          .query(`
            UPDATE applications
            SET contract_url = @contract_url
            OUTPUT INSERTED.*
            WHERE id = @id
          `);

        if (result.recordset.length === 0) {
          return {
            status: 404,
            headers,
            jsonBody: { error: 'Application not found' },
          };
        }

        return {
          status: 200,
          headers,
          jsonBody: result.recordset[0],
        };
      }

      if (!status) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'Status is required' },
        };
      }

      // Valid statuses for the application workflow
      const validStatuses = [
        'submitted',
        'reviewing',
        'denied',
        'waitlisted',
        'interview_scheduled',
        'accepted',
        'approved',  // Legacy
        'rejected',  // Legacy
      ];

      if (!validStatuses.includes(status)) {
        return {
          status: 400,
          headers,
          jsonBody: { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        };
      }

      // Build dynamic update query based on provided fields
      const request = pool.request()
        .input('id', sql.Int, id)
        .input('status', sql.NVarChar, status)
        .input('reviewed_by', sql.NVarChar, reviewed_by || null)
        .input('admin_notes', sql.NVarChar, admin_notes || null)
        .input('interview_scheduled_at', sql.DateTime2, interview_scheduled_at ? new Date(interview_scheduled_at) : null)
        .input('interview_notes', sql.NVarChar, interview_notes || null)
        .input('decision_reason', sql.NVarChar, decision_reason || null);

      // Set timestamp columns based on status change
      let additionalColumns = '';
      if (status === 'waitlisted') {
        additionalColumns = ', waitlisted_at = GETDATE()';
      } else if (status === 'accepted') {
        additionalColumns = ', accepted_at = GETDATE()';
      }

      const result = await request.query(`
          UPDATE applications
          SET status = @status, 
              reviewed_by = @reviewed_by, 
              reviewed_at = GETDATE(),
              admin_notes = COALESCE(@admin_notes, admin_notes),
              interview_scheduled_at = COALESCE(@interview_scheduled_at, interview_scheduled_at),
              interview_notes = COALESCE(@interview_notes, interview_notes),
              decision_reason = COALESCE(@decision_reason, decision_reason)
              ${additionalColumns}
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return {
          status: 404,
          headers,
          jsonBody: { error: 'Application not found' },
        };
      }

      const updatedApplication = result.recordset[0];
      context.log(`Application ${id} updated to status: ${status}`);

      // Send email notification based on status change
      const emailContext: {
        firstName: string;
        lastName: string;
        email: string;
        interviewDate?: Date;
        interviewNotes?: string;
        decisionReason?: string;
        onboardingLink?: string;
        contractUrl?: string;
      } = {
        firstName: updatedApplication.first_name,
        lastName: updatedApplication.last_name,
        email: updatedApplication.email,
        interviewDate: interview_scheduled_at ? new Date(interview_scheduled_at) : undefined,
        interviewNotes: interview_notes,
        decisionReason: decision_reason,
        contractUrl: updatedApplication.contract_url,
      };

      try {
        let emailResult;
        switch (status) {
          case 'denied':
            emailResult = await emailService.sendDenialEmail(emailContext);
            context.log('Denial email sent:', emailResult);
            break;
          case 'waitlisted':
            emailResult = await emailService.sendWaitlistEmail(emailContext);
            context.log('Waitlist email sent:', emailResult);
            break;
          case 'interview_scheduled':
            // Send interview email with booking link and contract (if uploaded)
            emailResult = await emailService.sendInterviewEmail(emailContext);
            context.log('Interview invitation email sent:', emailResult);
            break;
          case 'accepted': {
            // Create practitioner record with onboarding token
            context.log('Creating practitioner from application...');
            const practitionerResult = await practitionerService.createPractitionerFromApplication(
              pool,
              updatedApplication
            );
            
            if (practitionerResult.success && practitionerResult.onboardingLink) {
              context.log(`Practitioner created: ${practitionerResult.practitionerId}`);
              emailContext.onboardingLink = practitionerResult.onboardingLink;
            } else {
              context.warn('Failed to create practitioner:', practitionerResult.error);
              // Still send email but without personalized onboarding link
            }
            
            emailResult = await emailService.sendAcceptanceEmail(emailContext);
            context.log('Acceptance email sent:', emailResult);
            break;
          }
        }
      } catch (emailError) {
        // Log email error but don't fail the request
        context.warn('Failed to send email notification:', emailError);
      }

      return {
        status: 200,
        headers,
        jsonBody: updatedApplication,
      };
    }

    return {
      status: 405,
      headers,
      jsonBody: { error: 'Method not allowed' },
    };
  } catch (error) {
    context.error('Error in applications handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return {
      status: 500,
      headers,
      jsonBody: { error: errorMessage },
    };
  }
}

app.http('applications', {
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'applications/{id?}',
  handler: applicationsHandler,
});
