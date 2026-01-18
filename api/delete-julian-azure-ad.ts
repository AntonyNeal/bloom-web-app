/**
 * Delete Julian's Azure AD / M365 account
 * 
 * Usage: npx ts-node delete-julian-azure-ad.ts
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import * as fs from 'fs';
import 'isomorphic-fetch';

// Load settings from local.settings.json
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));

const JULIAN_UPN = 'julian.dellabosca@life-psychology.com.au';

async function deleteJulianAzureAd() {
  console.log('\n🗑️  Deleting Julian\'s Azure AD account...\n');
  
  const tenantId = settings.Values.AZURE_AD_TENANT_ID;
  const clientId = settings.Values.AZURE_AD_CLIENT_ID;
  const clientSecret = settings.Values.AZURE_AD_CLIENT_SECRET;
  
  if (!tenantId || !clientId || !clientSecret) {
    console.error('❌ Azure AD credentials not found in local.settings.json');
    console.log('Required: AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET');
    process.exit(1);
  }
  
  // Create Graph client
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });
  const graphClient = Client.initWithMiddleware({ authProvider });
  
  try {
    // Find the user by UPN
    console.log(`Looking for user: ${JULIAN_UPN}`);
    const user = await graphClient.api(`/users/${JULIAN_UPN}`).get();
    
    console.log(`Found user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Display Name: ${user.displayName}`);
    console.log(`  UPN: ${user.userPrincipalName}`);
    console.log(`  Mail: ${user.mail}`);
    
    // Delete the user
    console.log(`\nDeleting user...`);
    await graphClient.api(`/users/${user.id}`).delete();
    
    console.log(`\n✅ Successfully deleted ${JULIAN_UPN} from Azure AD`);
    console.log(`\n🎉 Julian can now go through fresh onboarding to get a new M365 account!`);
    
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 404) {
      console.log(`\n📭 User ${JULIAN_UPN} not found in Azure AD - already deleted or never existed`);
    } else {
      console.error(`\n❌ Error: ${err.message || error}`);
      process.exit(1);
    }
  }
}

deleteJulianAzureAd();
