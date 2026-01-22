/**
 * Public Practitioners API
 * 
 * Returns active practitioners for the public website.
 * Only returns practitioners who are:
 * - is_active = 1 (activated by admin)
 * - Have completed onboarding
 * - Have a public profile set up
 * 
 * This powers the "Meet Our Team" / psychologists listing on the website.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;

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

// Public practitioner profile - only safe fields exposed
interface PublicPractitioner {
  id: string;
  slug: string;
  displayName: string;
  firstName: string;
  headline: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  qualifications: string | null;
  specializations: string[];
  areasOfFocus: string[];
  therapyApproaches: string[];
  languages: string[];
  sessionTypes: string[];
  experienceYears: number | null;
  acceptingNewClients: boolean;
  medicareProvider: boolean;
  ndisRegistered: boolean;
}

async function publicPractitionersHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    // Cache for 5 minutes - practitioners don't change often
    'Cache-Control': 'public, max-age=300',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    const config = getConfig();
    pool = await sql.connect(config);

    // Check if we're fetching a single practitioner by slug
    const slug = req.params.slug;
    
    if (slug) {
      // Single practitioner lookup - use only base columns
      const result = await pool.request()
        .input('slug', sql.NVarChar, slug)
        .query(`
          SELECT 
            p.id,
            LOWER(REPLACE(p.display_name, ' ', '-')) as url_slug,
            p.display_name,
            p.first_name,
            p.bio,
            p.profile_photo_url,
            p.specializations,
            p.languages,
            p.session_types,
            p.experience_years,
            COALESCE(p.medicare_provider, 1) as medicare_provider,
            COALESCE(p.ndis_registered, 0) as ndis_registered
          FROM practitioners p
          WHERE p.is_active = 1
            AND p.onboarding_completed_at IS NOT NULL
            AND LOWER(REPLACE(p.display_name, ' ', '-')) = @slug
        `);

      if (result.recordset.length === 0) {
        return {
          status: 404,
          headers,
          jsonBody: { success: false, error: 'Practitioner not found' },
        };
      }

      const row = result.recordset[0];
      const practitioner = mapRowToPractitioner(row);

      return {
        status: 200,
        headers,
        jsonBody: { success: true, practitioner },
      };
    }

    // List all active practitioners
    // Query uses only base columns that always exist, with optional V030 columns
    const result = await pool.request().query(`
      SELECT 
        p.id,
        LOWER(REPLACE(p.display_name, ' ', '-')) as url_slug,
        p.display_name,
        p.first_name,
        p.bio,
        p.profile_photo_url,
        p.specializations,
        p.languages,
        p.session_types,
        p.experience_years,
        COALESCE(p.medicare_provider, 1) as medicare_provider,
        COALESCE(p.ndis_registered, 0) as ndis_registered
      FROM practitioners p
      WHERE p.is_active = 1
        AND p.onboarding_completed_at IS NOT NULL
      ORDER BY p.display_name
    `);

    context.log(`Found ${result.recordset.length} active practitioners for public website`);

    const practitioners = result.recordset.map(mapRowToPractitioner);

    return {
      status: 200,
      headers,
      jsonBody: { 
        success: true, 
        practitioners,
        count: practitioners.length,
      },
    };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    context.error('Error fetching public practitioners:', errMsg);
    return {
      status: 500,
      headers,
      jsonBody: { 
        success: false, 
        error: 'Failed to fetch practitioners',
        details: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

function parseJsonSafe(value: string | null, fallback: string[] = []): string[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function mapRowToPractitioner(row: Record<string, unknown>): PublicPractitioner {
  return {
    id: row.id as string,
    slug: row.url_slug as string,
    displayName: row.display_name as string,
    firstName: row.first_name as string,
    headline: (row.headline as string | null) || null,
    bio: (row.bio as string | null) || null,
    profilePhotoUrl: (row.profile_photo_url as string | null) || null,
    qualifications: (row.qualifications_display as string | null) || null,
    specializations: parseJsonSafe(row.specializations as string),
    areasOfFocus: parseJsonSafe(row.areas_of_focus as string),
    therapyApproaches: parseJsonSafe(row.therapy_approaches as string),
    languages: parseJsonSafe(row.languages as string, ['English']),
    sessionTypes: parseJsonSafe(row.session_types as string, ['Telehealth']),
    experienceYears: (row.experience_years as number | null) || null,
    acceptingNewClients: row.accepting_new_clients !== undefined ? Boolean(row.accepting_new_clients) : true,
    medicareProvider: Boolean(row.medicare_provider),
    ndisRegistered: Boolean(row.ndis_registered),
  };
}

// List all practitioners
app.http('public-practitioners-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'public/practitioners',
  handler: publicPractitionersHandler,
});

// Get single practitioner by slug
app.http('public-practitioners-get', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'public/practitioners/{slug}',
  handler: publicPractitionersHandler,
});

export default publicPractitionersHandler;
