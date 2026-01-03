/**
 * Practitioner ID Mapping
 * 
 * Maps Azure AD B2C User Object IDs to Halaxy Practitioner IDs.
 * This is the simplest approach for a small practice.
 * 
 * To add a new practitioner:
 * 1. Get their Azure AD Object ID from Entra ID portal (Users > [User] > Object ID)
 * 2. Get their Halaxy Practitioner ID from Halaxy (Settings > API or from the URL)
 * 3. Add the mapping below
 * 
 * Future: Could move to Azure App Configuration for dynamic updates without deploy
 */

export interface PractitionerConfig {
  halaxyPractitionerId: string;
  halaxyPractitionerRoleId: string;
  displayName: string;
  email: string;
}

/**
 * Map of Azure AD User Object ID → Practitioner Configuration
 * 
 * The Azure AD Object ID is the `localAccountId` from MSAL AccountInfo
 * or the `oid` claim in the JWT token
 */
export const PRACTITIONER_MAP: Record<string, PractitionerConfig> = {
  // ==========================================================================
  // EXAMPLE - Replace with actual values
  // ==========================================================================
  
  // Zoe Semmler
  // Azure AD Object ID → Halaxy IDs
  // Get Azure ID from: Azure Portal > Entra ID > Users > Zoe > Object ID
  // Get Halaxy ID from: Halaxy > Your profile URL or API settings
  
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': {
  //   halaxyPractitionerId: 'PR-XXXXXXX',
  //   halaxyPractitionerRoleId: 'EPR-XXXXXXX',
  //   displayName: 'Zoe Semmler',
  //   email: 'zoe@life-psychology.com.au',
  // },

  // ==========================================================================
  // TEST CLINICIAN - For development and testing
  // ==========================================================================
  
  // Test user - use this Azure AD Object ID for testing
  // In production, replace with real practitioner Azure AD IDs
  'test-clinician-001': {
    halaxyPractitionerId: '1304541',
    halaxyPractitionerRoleId: 'PR-2442591',
    displayName: 'Dr. Test Clinician',
    email: 'test@life-psychology.com.au',
  },

  // ==========================================================================
  // PRODUCTION MAPPINGS - Add your practitioners here
  // ==========================================================================

  // Zoe Semmler - Add her Azure AD Object ID when she's set up in Entra ID
  // To find her Object ID:
  // 1. Azure Portal > Entra ID > Users > Zoe Semmler > Object ID
  // 2. Or have her log in and check browser console for localAccountId
  
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': {
  //   halaxyPractitionerId: '1304541',
  //   halaxyPractitionerRoleId: 'PR-2442591',
  //   displayName: 'Zoe Semmler',
  //   email: 'zoe@life-psychology.com.au',
  // },
};

/**
 * Get practitioner config from Azure AD user ID
 * 
 * @param azureUserId - The Azure AD Object ID (localAccountId from MSAL)
 * @returns PractitionerConfig or null if not found
 */
export function getPractitionerConfig(azureUserId: string): PractitionerConfig | null {
  return PRACTITIONER_MAP[azureUserId] || null;
}

/**
 * Get Halaxy Practitioner ID from Azure AD user ID
 * 
 * @param azureUserId - The Azure AD Object ID
 * @returns Halaxy practitioner ID or null
 */
export function getHalaxyPractitionerId(azureUserId: string): string | null {
  const config = getPractitionerConfig(azureUserId);
  return config?.halaxyPractitionerId || null;
}

/**
 * Check if a user is a registered practitioner
 */
export function isPractitioner(azureUserId: string): boolean {
  return azureUserId in PRACTITIONER_MAP;
}
