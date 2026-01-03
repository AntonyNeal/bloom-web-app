/**
 * Azure AD B2C User Management Service
 * 
 * Creates users in Azure AD B2C via Microsoft Graph API.
 * Used during practitioner onboarding to create their Azure AD account.
 * 
 * Required Key Vault Secrets (referenced via Function App settings):
 * - azure-ad-tenant-id: The B2C tenant ID (e.g., "21f0abde-bd22-47bb-861a-64428079d129")
 * - azure-ad-client-id: App registration client ID with User.ReadWrite.All permission
 * - azure-ad-client-secret: App registration client secret
 * - azure-ad-b2c-domain: B2C tenant domain (e.g., "lifepsychologyaub2c.onmicrosoft.com")
 * 
 * Function App settings should reference these as:
 * - AZURE_AD_TENANT_ID=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-tenant-id/)
 * - AZURE_AD_CLIENT_ID=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-client-id/)
 * - AZURE_AD_CLIENT_SECRET=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-client-secret/)
 * - AZURE_AD_B2C_DOMAIN=@Microsoft.KeyVault(SecretUri=https://lpa-kv-dev.vault.azure.net/secrets/azure-ad-b2c-domain/)
 */

import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import 'isomorphic-fetch';

export interface CreateAzureUserParams {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  password: string;
}

export interface AzureUserResult {
  id: string;  // Azure AD Object ID
  userPrincipalName: string;
  displayName: string;
  email: string;
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
 * Create a new user in Azure AD B2C
 * 
 * This creates a local account with email as the sign-in identifier.
 * The user can then sign in using their email address and the password set here.
 * 
 * @param params User creation parameters
 * @returns The created user's Azure AD details including Object ID
 */
export async function createAzureUser(params: CreateAzureUserParams): Promise<AzureUserResult> {
  const { email, firstName, lastName, displayName, password } = params;
  
  const graphClient = getGraphClient();
  
  // Get the B2C tenant domain from environment (e.g., "lifepsychologyaub2c.onmicrosoft.com")
  const b2cDomain = process.env.AZURE_AD_B2C_DOMAIN;
  
  if (!b2cDomain) {
    throw new Error('AZURE_AD_B2C_DOMAIN environment variable is required');
  }

  // Create user with local account identity (email as sign-in)
  // This is the Azure AD B2C pattern for creating users via Graph API
  const userPayload = {
    displayName,
    givenName: firstName,
    surname: lastName,
    mail: email,
    identities: [
      {
        signInType: 'emailAddress',
        issuer: b2cDomain,
        issuerAssignedId: email,
      },
    ],
    passwordProfile: {
      password,
      forceChangePasswordNextSignIn: false,
    },
    passwordPolicies: 'DisablePasswordExpiration',
  };

  try {
    const result = await graphClient.api('/users').post(userPayload);
    
    return {
      id: result.id,
      userPrincipalName: result.userPrincipalName || email,
      displayName: result.displayName,
      email,
    };
  } catch (error) {
    // Handle specific Graph API errors
    if (error instanceof Error) {
      const graphError = error as any;
      if (graphError.statusCode === 400 && graphError.message?.includes('already exists')) {
        throw new Error(`A user with email ${email} already exists in Azure AD`);
      }
      if (graphError.statusCode === 403) {
        throw new Error('Insufficient permissions to create users. Ensure app has User.ReadWrite.All permission.');
      }
    }
    throw error;
  }
}

/**
 * Check if a user exists in Azure AD B2C by email
 * 
 * @param email The email to search for
 * @returns The user's Azure AD Object ID if found, null otherwise
 */
export async function findAzureUserByEmail(email: string): Promise<string | null> {
  const graphClient = getGraphClient();
  const b2cDomain = process.env.AZURE_AD_B2C_DOMAIN;
  
  if (!b2cDomain) {
    throw new Error('AZURE_AD_B2C_DOMAIN environment variable is required');
  }

  try {
    // Search for user by their email identity
    const result = await graphClient
      .api('/users')
      .filter(`identities/any(id:id/issuer eq '${b2cDomain}' and id/issuerAssignedId eq '${email}')`)
      .select('id,displayName,mail')
      .get();

    if (result.value && result.value.length > 0) {
      return result.value[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error searching for Azure AD user:', error);
    return null;
  }
}

/**
 * Delete a user from Azure AD B2C
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
