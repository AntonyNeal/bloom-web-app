/**
 * Practitioner Service
 * 
 * Fetches practitioner data from the Bloom API for the public website.
 * Used for team pages and practitioner profiles.
 */

import type { PublicPractitioner, PractitionersResponse } from '@/types/practitioner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Fetch all active practitioners for the team page
 */
export async function getPractitioners(): Promise<PublicPractitioner[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/practitioners`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch practitioners:', response.status);
      return [];
    }

    const data: PractitionersResponse = await response.json();
    
    if (!data.success || !data.practitioners) {
      console.error('API returned error:', data.error);
      return [];
    }

    return data.practitioners;
  } catch (error) {
    console.error('Error fetching practitioners:', error);
    return [];
  }
}

/**
 * Fetch a single practitioner by their URL slug
 */
export async function getPractitionerBySlug(slug: string): Promise<PublicPractitioner | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/practitioners/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch practitioner:', response.status);
      return null;
    }

    const data: PractitionersResponse = await response.json();
    
    if (!data.success || !data.practitioner) {
      return null;
    }

    return data.practitioner;
  } catch (error) {
    console.error('Error fetching practitioner:', error);
    return null;
  }
}

/**
 * Get all practitioner slugs for static generation
 */
export async function getPractitionerSlugs(): Promise<string[]> {
  const practitioners = await getPractitioners();
  return practitioners.map(p => p.slug);
}
