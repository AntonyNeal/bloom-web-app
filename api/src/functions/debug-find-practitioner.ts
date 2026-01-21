/**
 * Debug Find Practitioner
 * 
 * Search Halaxy for a practitioner by name and get their IDs.
 * Also supports finding PractitionerRole by practitioner ID.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { HalaxyClient } from '../services/halaxy/client';

async function debugFindPractitioner(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const client = new HalaxyClient();
    
    // Mode 1: Find practitioner by name
    const firstName = request.query.get('firstName');
    const lastName = request.query.get('lastName');
    
    // Mode 2: Get all PractitionerRoles
    const listRoles = request.query.get('listRoles') === 'true';
    
    // Mode 3: Get role by practitioner ID
    const practitionerId = request.query.get('practitionerId');
    
    if (listRoles) {
      context.log('Listing all PractitionerRoles');
      const roles = await client.getAllPractitionerRoles();
      return {
        status: 200,
        headers,
        jsonBody: {
          success: true,
          count: roles.length,
          roles: roles.map(r => ({
            id: r.id,
            active: r.active,
            practitioner: r.practitioner,
            organization: r.organization,
            location: r.location,
          })),
        },
      };
    }
    
    if (practitionerId) {
      context.log(`Finding PractitionerRoles for: ${practitionerId}`);
      const roles = await client.getPractitionerRolesByPractitioner(practitionerId);
      return {
        status: 200,
        headers,
        jsonBody: {
          success: true,
          practitionerId,
          count: roles.length,
          roles: roles.map(r => ({
            id: r.id,
            active: r.active,
            practitioner: r.practitioner,
            organization: r.organization,
          })),
        },
      };
    }
    
    if (!firstName && !lastName) {
      return {
        status: 400,
        headers,
        jsonBody: {
          success: false,
          error: 'Provide firstName/lastName, practitionerId, or listRoles=true',
          examples: [
            '?firstName=Demo&lastName=Psychologist',
            '?practitionerId=PR-1955619',
            '?listRoles=true',
          ],
        },
      };
    }
    
    context.log(`Searching Halaxy for: "${firstName}" "${lastName}"`);
    
    // Search for the practitioner
    const practitioner = await client.findPractitionerByName(firstName || '', lastName || '');
    
    if (!practitioner) {
      return {
        status: 404,
        headers,
        jsonBody: {
          success: false,
          error: `Practitioner not found: ${firstName} ${lastName}`,
          searchedFor: { firstName, lastName },
        },
      };
    }
    
    context.log(`Found practitioner: ${practitioner.id}`);
    
    // Get their PractitionerRoles
    const roles = await client.getPractitionerRolesByPractitioner(practitioner.id);
    context.log(`Found ${roles.length} PractitionerRoles`);
    
    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        practitioner: {
          id: practitioner.id,
          name: practitioner.name,
          active: practitioner.active,
          identifier: practitioner.identifier,
        },
        practitionerRoles: roles.map(r => ({
          id: r.id,
          active: r.active,
          practitioner: r.practitioner,
          organization: r.organization,
          location: r.location,
        })),
        suggestion: roles.length > 0 ? {
          halaxy_practitioner_id: practitioner.id,
          halaxy_practitioner_role_id: roles[0].id,
        } : null,
      },
    };
  } catch (error) {
    context.error('Error searching for practitioner:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('debugFindPractitioner', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'halaxy/find-practitioner',
  handler: debugFindPractitioner,
});

export default debugFindPractitioner;
