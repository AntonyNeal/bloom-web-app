/**
 * Azure AD User Management Service
 * 
 * Creates users in Entra ID (main tenant) via Microsoft Graph API.
 * Used during practitioner onboarding to create their @life-psychology.com.au account.
 * 
 * This creates REAL email accounts with Outlook mailboxes (requires M365 license).
 * 
 * Required Key Vault Secrets (referenced via Function App settings):
 * - azure-ad-tenant-id: The main tenant ID (e.g., "21f0abde-bd22-47bb-861a-64428079d129")
 * - azure-ad-client-id: App registration client ID with User.ReadWrite.All permission
 * - azure-ad-client-secret: App registration client secret
 * 
 * Function App settings should reference these as:
 * - AZURE_AD_TENANT_ID=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-tenant-id/)
 * - AZURE_AD_CLIENT_ID=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-client-id/)
 * - AZURE_AD_CLIENT_SECRET=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-client-secret/)
 */

import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import 'isomorphic-fetch';

// Life Psychology Australia domain
const EMAIL_DOMAIN = 'life-psychology.com.au';

export interface CreateAzureUserParams {
  email: string;           // Their personal email (for contact)
  firstName: string;
  lastName: string;
  displayName: string;
  password: string;
}

export interface AzureUserResult {
  id: string;              // Azure AD Object ID
  userPrincipalName: string;  // Their new @life-psychology.com.au email
  displayName: string;
  mail: string;            // Primary email (same as UPN)
}

/**
 * Generate a username from first and last name
 * e.g., "Julian" + "Neal" -> "julian.neal"
 */
function generateUsername(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}`;
}

/**
 * Get Microsoft Graph client with app-only authentication
 * Uses client credentials flow (app registration with User.ReadWrite.All permission)
 */
function getGraphClient(): Client {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure AD configuration missing. Required: AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET');
  }

  // Create client credentials credential
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Create auth provider with the .default scope for app-only auth
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  // Create and return the Graph client
  return Client.initWithMiddleware({ authProvider });
}

/**
 * Create a new user in Entra ID with a @life-psychology.com.au email
 * 
 * This creates a real email account (requires M365 license to be assigned separately).
 * The user can sign into Outlook and receive/send emails at their new address.
 * 
 * @param params User creation parameters
 * @returns The created user's Azure AD details including their new email
 */
export async function createAzureUser(params: CreateAzureUserParams): Promise<AzureUserResult> {
  const { email, firstName, lastName, displayName, password } = params;
  
  const graphClient = getGraphClient();
  
  // Generate their @life-psychology.com.au email address
  const username = generateUsername(firstName, lastName);
  const userPrincipalName = `${username}@${EMAIL_DOMAIN}`;
  const mailNickname = username.replace('.', '');

  // Create user in main Entra ID tenant
  const userPayload = {
    accountEnabled: true,
    displayName,
    givenName: firstName,
    surname: lastName,
    mailNickname,
    userPrincipalName,
    otherMails: [email],  // Store their personal email for contact
    passwordProfile: {
      password,
      forceChangePasswordNextSignIn: false,
    },
    usageLocation: 'AU',  // Required for license assignment
  };

  try {
    const result = await graphClient.api('/users').post(userPayload);
    
    return {
      id: result.id,
      userPrincipalName: result.userPrincipalName,
      displayName: result.displayName,
      mail: result.userPrincipalName,  // Email will match UPN after mailbox provisioning
    };
  } catch (error) {
    // Handle specific Graph API errors
    if (error instanceof Error) {
      const graphError = error as any;
      if (graphError.statusCode === 400) {
        if (graphError.message?.includes('userPrincipalName already exists')) {
          throw new Error(`Email ${userPrincipalName} already exists. Contact admin for assistance.`);
        }
        if (graphError.message?.includes('password')) {
          throw new Error('Password does not meet complexity requirements.');
        }
      }
      if (graphError.statusCode === 403) {
        throw new Error('Insufficient permissions to create users. Ensure app has User.ReadWrite.All permission.');
      }
    }
    throw error;
  }
}

/**
 * Find a user in Entra ID by their UPN (email)
 * 
 * @param userPrincipalName The @life-psychology.com.au email to search for
 * @returns The user's Azure AD Object ID if found, null otherwise
 */
export async function findAzureUserByEmail(userPrincipalName: string): Promise<string | null> {
  const graphClient = getGraphClient();

  try {
    const result = await graphClient
      .api(`/users/${userPrincipalName}`)
      .select('id,displayName,userPrincipalName')
      .get();

    return result?.id || null;
  } catch (error) {
    const graphError = error as any;
    if (graphError.statusCode === 404) {
      return null;  // User doesn't exist
    }
    console.error('Error searching for Azure AD user:', error);
    return null;
  }
}

/**
 * Check if a username is available
 * 
 * @param firstName First name
 * @param lastName Last name
 * @returns Object with availability status and suggested UPN
 */
export async function checkUsernameAvailability(firstName: string, lastName: string): Promise<{
  available: boolean;
  suggestedEmail: string;
  alternativeEmail?: string;
}> {
  const username = generateUsername(firstName, lastName);
  const suggestedEmail = `${username}@${EMAIL_DOMAIN}`;
  
  const existingUser = await findAzureUserByEmail(suggestedEmail);
  
  if (!existingUser) {
    return { available: true, suggestedEmail };
  }
  
  // Try with a number suffix
  for (let i = 2; i <= 10; i++) {
    const altEmail = `${username}${i}@${EMAIL_DOMAIN}`;
    const altExists = await findAzureUserByEmail(altEmail);
    if (!altExists) {
      return { 
        available: false, 
        suggestedEmail, 
        alternativeEmail: altEmail 
      };
    }
  }
  
  return { available: false, suggestedEmail };
}

/**
 * Delete a user from Entra ID
 * Used for cleanup during testing or when removing practitioners
 * 
 * @param objectId The Azure AD Object ID of the user to delete
 */
export async function deleteAzureUser(objectId: string): Promise<void> {
  const graphClient = getGraphClient();
  
  try {
    await graphClient.api(`/users/${objectId}`).delete();
  } catch (error) {
    if (error instanceof Error) {
      const graphError = error as any;
      if (graphError.statusCode === 404) {
        // User already doesn't exist, that's fine
        return;
      }
    }
    throw error;
  }
}
