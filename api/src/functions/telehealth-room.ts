/**
 * Telehealth Room API
 * 
 * Uses Azure Communication Services for video calls.
 * Creates rooms, generates access tokens, manages call state.
 * 
 * Endpoints:
 *   POST /api/telehealth/room/create - Create ACS room for appointment (clinician)
 *   POST /api/telehealth/room/join - Join room and get access token (patient or clinician)
 *   POST /api/telehealth/room/end - End call / leave room
 *   GET  /api/telehealth/room/status/:appointmentId - Get room status
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Configuration
// ============================================================================

const getDbConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: { encrypt: true, trustServerCertificate: false },
  };
};

// Azure Communication Services config
const ACS_CONNECTION_STRING = process.env.ACS_CONNECTION_STRING || process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
const ACS_ENDPOINT = process.env.ACS_ENDPOINT || 'https://lpa-communication-service.australia.communication.azure.com';

// ============================================================================
// Azure Communication Services Helpers
// ============================================================================

interface AcsRoom {
  id: string;
  createdAt: string;
  validFrom: string;
  validUntil: string;
}

interface AcsToken {
  token: string;
  expiresOn: string;
  user: { communicationUserId: string };
}

/**
 * Create an ACS room for the video call
 */
async function createAcsRoom(
  validFrom: Date,
  validUntil: Date
): Promise<AcsRoom> {
  // Dynamic import for ACS SDK
  const { CommunicationIdentityClient: _CIC } = await import('@azure/communication-identity');
  const { RoomsClient } = await import('@azure/communication-rooms');
  
  if (!ACS_CONNECTION_STRING) {
    throw new Error('ACS_CONNECTION_STRING not configured');
  }

  const roomsClient = new RoomsClient(ACS_CONNECTION_STRING);
  
  const room = await roomsClient.createRoom({
    validFrom,
    validUntil,
  });

  return {
    id: room.id,
    createdAt: room.createdAt?.toISOString() || new Date().toISOString(),
    validFrom: room.validFrom?.toISOString() || validFrom.toISOString(),
    validUntil: room.validUntil?.toISOString() || validUntil.toISOString(),
  };
}

/**
 * Create a user identity and access token for joining a call
 */
async function createAcsUserToken(
  roomId: string,
  role: 'Presenter' | 'Attendee'
): Promise<AcsToken> {
  const { CommunicationIdentityClient } = await import('@azure/communication-identity');
  const { RoomsClient } = await import('@azure/communication-rooms');
  
  if (!ACS_CONNECTION_STRING) {
    throw new Error('ACS_CONNECTION_STRING not configured');
  }

  const identityClient = new CommunicationIdentityClient(ACS_CONNECTION_STRING);
  const roomsClient = new RoomsClient(ACS_CONNECTION_STRING);
  
  // Create a new user identity
  const user = await identityClient.createUser();
  
  // Add user as participant to the room
  await roomsClient.addOrUpdateParticipants(roomId, [
    {
      id: user,
      role,
    },
  ]);
  
  // Generate access token with rooms scope
  const tokenResponse = await identityClient.getToken(user, ['voip']);
  
  return {
    token: tokenResponse.token,
    expiresOn: tokenResponse.expiresOn.toISOString(),
    user: { communicationUserId: user.communicationUserId },
  };
}

// ============================================================================
// POST /api/telehealth/room/create - Create room for appointment
// ============================================================================

async function createRoom(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Telehealth: Create room');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      appointmentId: string;
      practitionerId: string;
      appointmentTime: string;
      durationMinutes: number;
    };

    if (!body.appointmentId || !body.practitionerId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'appointmentId and practitionerId required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Check if room already exists
    const existing = await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .query(`
        SELECT room_id, acs_room_id, room_status
        FROM telehealth_rooms
        WHERE appointment_halaxy_id = @appointmentId
      `);

    if (existing.recordset.length > 0) {
      const room = existing.recordset[0];
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            roomId: room.room_id,
            acsRoomId: room.acs_room_id,
            status: room.room_status,
            isExisting: true,
          },
        },
      };
    }

    // Create ACS room
    // Room valid from 30 mins before appointment until 2 hours after end
    const appointmentTime = new Date(body.appointmentTime);
    const durationMins = body.durationMinutes || 50;
    const validFrom = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
    const validUntil = new Date(appointmentTime.getTime() + (durationMins + 120) * 60 * 1000);

    const acsRoom = await createAcsRoom(validFrom, validUntil);

    // Store room in database
    const roomId = uuidv4();
    
    await pool.request()
      .input('id', sql.UniqueIdentifier, roomId)
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .input('practitionerId', sql.UniqueIdentifier, body.practitionerId)
      .input('acsRoomId', sql.NVarChar, acsRoom.id)
      .input('validFrom', sql.DateTime2, validFrom)
      .input('validUntil', sql.DateTime2, validUntil)
      .query(`
        INSERT INTO telehealth_rooms (
          id, appointment_halaxy_id, practitioner_id,
          acs_room_id, room_status, valid_from, valid_until, created_at
        ) VALUES (
          @id, @appointmentId, @practitionerId,
          @acsRoomId, 'created', @validFrom, @validUntil, GETUTCDATE()
        )
      `);

    // Update session token with room ID
    await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .input('roomId', sql.UniqueIdentifier, roomId)
      .query(`
        UPDATE session_tokens
        SET room_id = @roomId
        WHERE appointment_halaxy_id = @appointmentId
      `);

    context.log(`Created telehealth room ${roomId} for appointment ${body.appointmentId}`);

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: {
          roomId,
          acsRoomId: acsRoom.id,
          validFrom: validFrom.toISOString(),
          validUntil: validUntil.toISOString(),
          status: 'created',
          isExisting: false,
        },
      },
    };
  } catch (error) {
    context.error('Error creating room:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// POST /api/telehealth/room/join - Join room and get token
// ============================================================================

async function joinRoom(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Telehealth: Join room');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      appointmentId: string;
      participantType: 'clinician' | 'patient';
      participantId: string;
      participantName: string;
    };

    if (!body.appointmentId || !body.participantType) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'appointmentId and participantType required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Get room
    const roomResult = await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .query(`
        SELECT id, acs_room_id, room_status, valid_from, valid_until
        FROM telehealth_rooms
        WHERE appointment_halaxy_id = @appointmentId
      `);

    if (roomResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Room not found for this appointment' },
      };
    }

    const room = roomResult.recordset[0];

    // Validate room timing
    const now = new Date();
    if (now < new Date(room.valid_from)) {
      return {
        status: 403,
        jsonBody: { success: false, error: 'Room is not open yet', code: 'ROOM_NOT_OPEN' },
      };
    }
    if (now > new Date(room.valid_until)) {
      return {
        status: 403,
        jsonBody: { success: false, error: 'Room has expired', code: 'ROOM_EXPIRED' },
      };
    }

    // If patient, check consent (for informational purposes only - consent not required to join video)
    if (body.participantType === 'patient') {
      const _consentResult = await pool.request()
        .input('appointmentId', sql.NVarChar, body.appointmentId)
        .query(`
          SELECT consent_given, withdrawn_at 
          FROM session_recording_consent
          WHERE appointment_halaxy_id = @appointmentId
        `);

      // Consent status is returned in room status - not blocking video join
    }

    // Generate ACS token
    // Clinicians are Presenters (can manage call), patients are Attendees
    const role = body.participantType === 'clinician' ? 'Presenter' : 'Attendee';
    const acsToken = await createAcsUserToken(room.acs_room_id, role);

    // Record participant join
    const participantId = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, participantId)
      .input('roomId', sql.UniqueIdentifier, room.id)
      .input('participantType', sql.NVarChar, body.participantType)
      .input('participantExternalId', sql.NVarChar, body.participantId)
      .input('participantName', sql.NVarChar, body.participantName)
      .input('acsUserId', sql.NVarChar, acsToken.user.communicationUserId)
      .query(`
        INSERT INTO telehealth_participants (
          id, room_id, participant_type, participant_external_id,
          participant_name, acs_user_id, joined_at
        ) VALUES (
          @id, @roomId, @participantType, @participantExternalId,
          @participantName, @acsUserId, GETUTCDATE()
        )
      `);

    // Update room status if this is the first join
    if (room.room_status === 'created') {
      await pool.request()
        .input('roomId', sql.UniqueIdentifier, room.id)
        .query(`
          UPDATE telehealth_rooms
          SET room_status = 'active', started_at = GETUTCDATE()
          WHERE id = @roomId
        `);
    }

    context.log(`Participant ${body.participantType} joined room for appointment ${body.appointmentId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          roomId: room.id,
          acsRoomId: room.acs_room_id,
          token: acsToken.token,
          tokenExpiresOn: acsToken.expiresOn,
          userId: acsToken.user.communicationUserId,
          participantId,
          endpoint: ACS_ENDPOINT,
        },
      },
    };
  } catch (error) {
    context.error('Error joining room:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// POST /api/telehealth/room/leave - Leave room
// ============================================================================

async function leaveRoom(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Telehealth: Leave room');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      participantId: string;
      endCall?: boolean; // Clinician can end the entire call
    };

    if (!body.participantId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'participantId required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Update participant record
    await pool.request()
      .input('participantId', sql.UniqueIdentifier, body.participantId)
      .query(`
        UPDATE telehealth_participants
        SET left_at = GETUTCDATE()
        WHERE id = @participantId
      `);

    // If clinician ending call, close the room
    if (body.endCall) {
      await pool.request()
        .input('participantId', sql.UniqueIdentifier, body.participantId)
        .query(`
          UPDATE telehealth_rooms
          SET room_status = 'ended', ended_at = GETUTCDATE()
          WHERE id = (
            SELECT room_id FROM telehealth_participants WHERE id = @participantId
          )
        `);
    }

    return {
      status: 200,
      jsonBody: { success: true },
    };
  } catch (error) {
    context.error('Error leaving room:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// GET /api/telehealth/room/status/:appointmentId - Get room status
// ============================================================================

async function getRoomStatus(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const appointmentId = request.params.appointmentId;
  context.log(`Telehealth: Get room status for ${appointmentId}`);

  if (!appointmentId) {
    return {
      status: 400,
      jsonBody: { success: false, error: 'appointmentId required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    // Get room with participants
    const roomResult = await pool.request()
      .input('appointmentId', sql.NVarChar, appointmentId)
      .query(`
        SELECT 
          r.id, r.acs_room_id, r.room_status, 
          r.valid_from, r.valid_until, r.started_at, r.ended_at,
          p.participant_type, p.participant_name, p.joined_at, p.left_at
        FROM telehealth_rooms r
        LEFT JOIN telehealth_participants p ON p.room_id = r.id
        WHERE r.appointment_halaxy_id = @appointmentId
      `);

    if (roomResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Room not found', code: 'NO_ROOM' },
      };
    }

    const room = roomResult.recordset[0];
    const participants = roomResult.recordset
      .filter(r => r.participant_type)
      .map(r => ({
        type: r.participant_type,
        name: r.participant_name,
        joinedAt: r.joined_at,
        leftAt: r.left_at,
        isActive: r.joined_at && !r.left_at,
      }));

    // Get consent status
    const consentResult = await pool.request()
      .input('appointmentId', sql.NVarChar, appointmentId)
      .query(`
        SELECT consent_given, withdrawn_at 
        FROM session_recording_consent
        WHERE appointment_halaxy_id = @appointmentId
      `);

    let recordingConsent: 'pending' | 'consented' | 'declined' = 'pending';
    if (consentResult.recordset.length > 0) {
      const consent = consentResult.recordset[0];
      recordingConsent = consent.consent_given && !consent.withdrawn_at ? 'consented' : 'declined';
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          roomId: room.id,
          status: room.room_status,
          validFrom: room.valid_from,
          validUntil: room.valid_until,
          startedAt: room.started_at,
          endedAt: room.ended_at,
          participants,
          recordingConsent,
          patientInRoom: participants.some(p => p.type === 'patient' && p.isActive),
          clinicianInRoom: participants.some(p => p.type === 'clinician' && p.isActive),
        },
      },
    };
  } catch (error) {
    context.error('Error getting room status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// Register Functions
// ============================================================================

app.http('telehealth-room-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'telehealth/room/create',
  handler: createRoom,
});

app.http('telehealth-room-join', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'telehealth/room/join',
  handler: joinRoom,
});

app.http('telehealth-room-leave', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'telehealth/room/leave',
  handler: leaveRoom,
});

app.http('telehealth-room-status', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'telehealth/room/status/{appointmentId}',
  handler: getRoomStatus,
});
