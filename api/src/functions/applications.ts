import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { sendDenialEmail, sendWaitlistEmail, sendInterviewEmail, sendApplicationReceivedWithScheduling } from '../services/email';
import { createInterviewToken } from './interview-scheduling';

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
        favorite_flower?: string;
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
        favorite_flower,
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

      // Check for existing application with this email
      const existingApp = await pool
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT id, status, created_at FROM applications WHERE email = @email');

      if (existingApp.recordset.length > 0) {
        const existing = existingApp.recordset[0];
        context.log(`Duplicate application attempt for email: ${email}, existing status: ${existing.status}`);
        return {
          status: 409,
          headers,
          jsonBody: {
            error: 'An application with this email address already exists.',
            existingStatus: existing.status,
            submittedAt: existing.created_at,
            message: 'If you need to update your application or have questions, please contact us at support@life-psychology.com.au',
          },
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
        .input('favorite_flower', sql.NVarChar, favorite_flower || null)
        .input('qualification_type', sql.NVarChar, qualification_type || null)
        .input(
          'qualification_check',
          sql.NVarChar,
          qualification_check ? JSON.stringify(qualification_check) : null
        ).query(`
          INSERT INTO applications (
            first_name, last_name, email, phone, ahpra_registration,
            specializations, experience_years, cv_url, certificate_url,
            photo_url, cover_letter, favorite_flower, qualification_type, qualification_check
          )
          OUTPUT INSERTED.*
          VALUES (
            @first_name, @last_name, @email, @phone, @ahpra_registration,
            @specializations, @experience_years, @cv_url, @certificate_url,
            @photo_url, @cover_letter, @favorite_flower, @qualification_type, @qualification_check
          )
        `);

      const newApplication = result.recordset[0];

      // Create interview token and send scheduling email
      try {
        const { token, schedulingLink } = await createInterviewToken(
          newApplication.id,
          {
            firstName: first_name,
            lastName: last_name,
            email,
          },
          context
        );

        context.log(`Created interview token for application ${newApplication.id}: ${token}`);

        // Send email with scheduling link
        const emailResult = await sendApplicationReceivedWithScheduling({
          firstName: first_name,
          email,
          schedulingLink,
        });

        context.log(`Sent application received email: ${JSON.stringify(emailResult)}`);
      } catch (tokenError) {
        // Log but don't fail the application submission
        context.warn('Failed to create interview token or send email:', tokenError);
      }

      return {
        status: 201,
        headers,
        jsonBody: newApplication,
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
        'offer_sent',
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
        .input('decision_reason', sql.NVarChar, decision_reason || null)
        .input('contract_url', sql.NVarChar, contract_url || null);

      // Set timestamp columns based on status change
      let additionalColumns = '';
      if (status === 'waitlisted') {
        additionalColumns = ', waitlisted_at = GETDATE()';
      } else if (status === 'accepted') {
        additionalColumns = ', accepted_at = GETDATE()';
      } else if (status === 'offer_sent') {
        additionalColumns = ', offer_sent_at = GETDATE()';
      }

      const result = await request.query(`
          UPDATE applications
          SET status = @status, 
              reviewed_by = @reviewed_by, 
              reviewed_at = GETDATE(),
              admin_notes = COALESCE(@admin_notes, admin_notes),
              interview_scheduled_at = COALESCE(@interview_scheduled_at, interview_scheduled_at),
              interview_notes = COALESCE(@interview_notes, interview_notes),
              decision_reason = COALESCE(@decision_reason, decision_reason),
              contract_url = @contract_url
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

      const updatedApp = result.recordset[0];
      context.log(`Application ${id} updated to status: ${status}`);

      // Send appropriate email based on status change
      const emailContext = {
        firstName: updatedApp.first_name,
        lastName: updatedApp.last_name,
        email: updatedApp.email,
        decisionReason: decision_reason || undefined,
        interviewNotes: interview_notes || undefined,
      };

      try {
        if (status === 'denied') {
          context.log(`Sending denial email to ${updatedApp.email}`);
          const emailResult = await sendDenialEmail(emailContext);
          context.log(`Denial email result: ${JSON.stringify(emailResult)}`);
        } else if (status === 'waitlisted') {
          context.log(`Sending waitlist email to ${updatedApp.email}`);
          const emailResult = await sendWaitlistEmail(emailContext);
          context.log(`Waitlist email result: ${JSON.stringify(emailResult)}`);
        } else if (status === 'interview_scheduled') {
          context.log(`Sending interview email to ${updatedApp.email}`);
          const emailResult = await sendInterviewEmail(emailContext);
          context.log(`Interview email result: ${JSON.stringify(emailResult)}`);
        }
      } catch (emailError) {
        // Log email error but don't fail the status update
        context.error(`Failed to send status email: ${emailError}`);
      }

      return {
        status: 200,
        headers,
        jsonBody: updatedApp,
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
    
    // Handle duplicate key constraint violation (race condition fallback)
    if (errorMessage.includes('UNIQUE KEY constraint') && errorMessage.includes('email')) {
      return {
        status: 409,
        headers,
        jsonBody: {
          error: 'An application with this email address already exists.',
          message: 'If you need to update your application or have questions, please contact us at support@life-psychology.com.au',
        },
      };
    }
    
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
