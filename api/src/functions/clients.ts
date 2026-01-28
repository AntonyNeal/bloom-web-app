/**
 * Clients API - Standalone Patient Management
 * Manages client records for Bloom practice management
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const sqlConfig: sql.config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

/**
 * GET /api/clients - List all clients for a practitioner
 * Query params: practitioner_id (required), search (optional)
 */
async function listClients(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const practitionerId = req.query.get('practitioner_id');
    const searchTerm = req.query.get('search');

    if (!practitionerId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'practitioner_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    let query = `
      SELECT 
        id, first_name, last_name, preferred_name, email, phone,
        date_of_birth, gender, medicare_number, ndis_number,
        created_at, updated_at, imported_from_halaxy
      FROM clients
      WHERE practitioner_id = @practitionerId 
        AND is_deleted = 0
    `;

    if (searchTerm) {
      query += ` AND (
        first_name LIKE @search OR 
        last_name LIKE @search OR 
        preferred_name LIKE @search OR
        email LIKE @search OR
        phone LIKE @search
      )`;
    }

    query += ' ORDER BY last_name, first_name';

    const request = pool.request();
    request.input('practitionerId', sql.UniqueIdentifier, practitionerId);
    if (searchTerm) {
      request.input('search', sql.NVarChar, `%${searchTerm}%`);
    }

    const result = await request.query(query);
    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, clients: result.recordset },
    };
  } catch (error) {
    context.error('[Clients API] List error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to retrieve clients' },
    };
  }
}

/**
 * GET /api/clients/:id - Get single client details
 */
async function getClient(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const clientId = req.params.id;

    if (!clientId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'client_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('clientId', sql.UniqueIdentifier, clientId);

    const result = await request.query(`
      SELECT 
        id, practitioner_id, first_name, last_name, preferred_name,
        email, phone, date_of_birth, gender,
        address_street, address_suburb, address_state, address_postcode,
        medicare_number, ndis_number,
        emergency_contact_name, emergency_contact_phone,
        notes, created_at, updated_at, imported_from_halaxy
      FROM clients
      WHERE id = @clientId AND is_deleted = 0
    `);

    await pool.close();

    if (result.recordset.length === 0) {
      return {
        status: 404,
        headers: corsHeaders,
        jsonBody: { error: 'Client not found' },
      };
    }

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, client: result.recordset[0] },
    };
  } catch (error) {
    context.error('[Clients API] Get error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to retrieve client' },
    };
  }
}

/**
 * POST /api/clients - Create new client
 */
async function createClient(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    interface CreateClientBody {
      practitioner_id: string;
      first_name: string;
      last_name: string;
      preferred_name?: string;
      email?: string;
      phone?: string;
      date_of_birth?: string;
      gender?: string;
    }
    const body = await req.json() as CreateClientBody;
    const {
      practitioner_id,
      first_name,
      last_name,
      preferred_name,
      email,
      phone,
      date_of_birth,
      gender,
      address_street,
      address_suburb,
      address_state,
      address_postcode,
      medicare_number,
      ndis_number,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
    } = body;

    if (!practitioner_id || !first_name || !last_name) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'practitioner_id, first_name, and last_name are required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    
    request.input('practitionerId', sql.UniqueIdentifier, practitioner_id);
    request.input('firstName', sql.NVarChar, first_name);
    request.input('lastName', sql.NVarChar, last_name);
    request.input('preferredName', sql.NVarChar, preferred_name || null);
    request.input('email', sql.NVarChar, email || null);
    request.input('phone', sql.NVarChar, phone || null);
    request.input('dateOfBirth', sql.Date, date_of_birth || null);
    request.input('gender', sql.NVarChar, gender || null);
    request.input('addressStreet', sql.NVarChar, address_street || null);
    request.input('addressSuburb', sql.NVarChar, address_suburb || null);
    request.input('addressState', sql.NVarChar, address_state || null);
    request.input('addressPostcode', sql.NVarChar, address_postcode || null);
    request.input('medicareNumber', sql.NVarChar, medicare_number || null);
    request.input('ndisNumber', sql.NVarChar, ndis_number || null);
    request.input('emergencyContactName', sql.NVarChar, emergency_contact_name || null);
    request.input('emergencyContactPhone', sql.NVarChar, emergency_contact_phone || null);
    request.input('notes', sql.NVarChar, notes || null);

    const result = await request.query(`
      INSERT INTO clients (
        practitioner_id, first_name, last_name, preferred_name,
        email, phone, date_of_birth, gender,
        address_street, address_suburb, address_state, address_postcode,
        medicare_number, ndis_number,
        emergency_contact_name, emergency_contact_phone, notes
      )
      OUTPUT INSERTED.id
      VALUES (
        @practitionerId, @firstName, @lastName, @preferredName,
        @email, @phone, @dateOfBirth, @gender,
        @addressStreet, @addressSuburb, @addressState, @addressPostcode,
        @medicareNumber, @ndisNumber,
        @emergencyContactName, @emergencyContactPhone, @notes
      )
    `);

    await pool.close();

    return {
      status: 201,
      headers: corsHeaders,
      jsonBody: { 
        success: true, 
        client_id: result.recordset[0].id,
        message: 'Client created successfully'
      },
    };
  } catch (error) {
    context.error('[Clients API] Create error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to create client' },
    };
  }
}

/**
 * PUT /api/clients/:id - Update client details
 */
async function updateClient(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    interface UpdateClientBody {
      first_name?: string;
      last_name?: string;
      preferred_name?: string;
      email?: string;
      phone?: string;
      date_of_birth?: string;
      gender?: string;
      address?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
      country?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    }
    const clientId = req.params.id;
    const body = await req.json() as UpdateClientBody;

    if (!clientId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'client_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('clientId', sql.UniqueIdentifier, clientId);

    // Build dynamic update query
    const updates: string[] = [];
    if (body.first_name !== undefined) {
      request.input('firstName', sql.NVarChar, body.first_name);
      updates.push('first_name = @firstName');
    }
    if (body.last_name !== undefined) {
      request.input('lastName', sql.NVarChar, body.last_name);
      updates.push('last_name = @lastName');
    }
    if (body.preferred_name !== undefined) {
      request.input('preferredName', sql.NVarChar, body.preferred_name);
      updates.push('preferred_name = @preferredName');
    }
    if (body.email !== undefined) {
      request.input('email', sql.NVarChar, body.email);
      updates.push('email = @email');
    }
    if (body.phone !== undefined) {
      request.input('phone', sql.NVarChar, body.phone);
      updates.push('phone = @phone');
    }
    if (body.date_of_birth !== undefined) {
      request.input('dateOfBirth', sql.Date, body.date_of_birth);
      updates.push('date_of_birth = @dateOfBirth');
    }
    if (body.gender !== undefined) {
      request.input('gender', sql.NVarChar, body.gender);
      updates.push('gender = @gender');
    }
    if (body.address_street !== undefined) {
      request.input('addressStreet', sql.NVarChar, body.address_street);
      updates.push('address_street = @addressStreet');
    }
    if (body.address_suburb !== undefined) {
      request.input('addressSuburb', sql.NVarChar, body.address_suburb);
      updates.push('address_suburb = @addressSuburb');
    }
    if (body.address_state !== undefined) {
      request.input('addressState', sql.NVarChar, body.address_state);
      updates.push('address_state = @addressState');
    }
    if (body.address_postcode !== undefined) {
      request.input('addressPostcode', sql.NVarChar, body.address_postcode);
      updates.push('address_postcode = @addressPostcode');
    }
    if (body.medicare_number !== undefined) {
      request.input('medicareNumber', sql.NVarChar, body.medicare_number);
      updates.push('medicare_number = @medicareNumber');
    }
    if (body.ndis_number !== undefined) {
      request.input('ndisNumber', sql.NVarChar, body.ndis_number);
      updates.push('ndis_number = @ndisNumber');
    }
    if (body.emergency_contact_name !== undefined) {
      request.input('emergencyContactName', sql.NVarChar, body.emergency_contact_name);
      updates.push('emergency_contact_name = @emergencyContactName');
    }
    if (body.emergency_contact_phone !== undefined) {
      request.input('emergencyContactPhone', sql.NVarChar, body.emergency_contact_phone);
      updates.push('emergency_contact_phone = @emergencyContactPhone');
    }
    if (body.notes !== undefined) {
      request.input('notes', sql.NVarChar, body.notes);
      updates.push('notes = @notes');
    }

    updates.push('updated_at = GETUTCDATE()');

    if (updates.length === 1) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'No fields to update' },
      };
    }

    await request.query(`
      UPDATE clients
      SET ${updates.join(', ')}
      WHERE id = @clientId AND is_deleted = 0
    `);

    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, message: 'Client updated successfully' },
    };
  } catch (error) {
    context.error('[Clients API] Update error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to update client' },
    };
  }
}

/**
 * DELETE /api/clients/:id - Soft delete client
 */
async function deleteClient(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const clientId = req.params.id;

    if (!clientId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'client_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('clientId', sql.UniqueIdentifier, clientId);

    await request.query(`
      UPDATE clients
      SET is_deleted = 1, deleted_at = GETUTCDATE()
      WHERE id = @clientId
    `);

    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, message: 'Client deleted successfully' },
    };
  } catch (error) {
    context.error('[Clients API] Delete error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to delete client' },
    };
  }
}

// Register endpoints
app.http('clients-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clients',
  handler: listClients,
});

app.http('clients-get', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clients/{id}',
  handler: getClient,
});

app.http('clients-create', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clients',
  handler: createClient,
});

app.http('clients-update', {
  methods: ['PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clients/{id}',
  handler: updateClient,
});

app.http('clients-delete', {
  methods: ['DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clients/{id}',
  handler: deleteClient,
});
