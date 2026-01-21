/**
 * Debug Find Practitioner
 * 
 * Search Halaxy for a practitioner by name and get their IDs.
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
    const firstName = request.query.get('firstName') || 'Demo';
    const lastName = request.query.get('lastName') || 'Psychologist';
    
    context.log(`Searching Halaxy for: "${firstName}" "${lastName}"`);
    
    const client = new HalaxyClient();
    
    // Search for the practitioner
    const practitioner = await client.findPractitionerByName(firstName, lastName);
    
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
  route: 'debug/find-practitioner',
  handler: debugFindPractitioner,
});

export default debugFindPractitioner;
