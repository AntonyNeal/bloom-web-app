/**
 * Cosmos DB Tracking Verification Script
 * 
 * This script:
 * 1. Connects to Cosmos DB
 * 2. Queries for tracking data
 * 3. Reports on data volume and quality
 * 4. Tests writing a sample tracking event
 */

import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || 'https://cdbt42kldozqahcu.documents.azure.com:443/';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const DATABASE_NAME = 'conversion-analytics';
const CONTAINER_NAME = 'user-sessions';

async function main() {
  console.log('🔍 Cosmos DB Tracking Verification\n');
  console.log('=' .repeat(60));
  
  if (!COSMOS_KEY) {
    console.error('❌ Error: COSMOS_KEY environment variable not set');
    console.log('\nPlease run:');
    console.log('  $env:COSMOS_KEY = (az cosmosdb keys list --name cdbt42kldozqahcu --resource-group rg-lpa-prod-opt --query primaryMasterKey -o tsv)');
    process.exit(1);
  }

  try {
    // Initialize Cosmos Client
    console.log('\n📡 Connecting to Cosmos DB...');
    const client = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      key: COSMOS_KEY,
    });

    const database = client.database(DATABASE_NAME);
    const container = database.container(CONTAINER_NAME);
    console.log('✅ Connected successfully');

    // Query 1: Count all tracking events
    console.log('\n📊 Querying tracking data...\n');
    
    const countQuery = 'SELECT VALUE COUNT(1) FROM c';
    const { resources: countResult } = await container.items
      .query(countQuery)
      .fetchAll();
    
    const totalEvents = countResult[0] || 0;
    console.log(`Total Events: ${totalEvents}`);

    if (totalEvents === 0) {
      console.log('\n⚠️  No tracking data found in Cosmos DB');
      console.log('\nPossible reasons:');
      console.log('  1. Website hasn\'t been visited yet');
      console.log('  2. Frontend tracking not calling Azure Function');
      console.log('  3. Azure Function environment variables not configured');
      console.log('  4. CORS blocking API calls');
      
      // Test write capability
      console.log('\n🧪 Testing write capability...');
      const testEvent = {
        id: `test-${Date.now()}`,
        userId: 'test-user',
        testName: 'verification-test',
        variant: 'test',
        timestamp: new Date().toISOString(),
        deviceType: 'test',
        location: 'AU',
        type: 'variant-allocation',
        ttl: 3600, // 1 hour
      };

      await container.items.create(testEvent);
      console.log('✅ Successfully wrote test event');
      console.log(`   Event ID: ${testEvent.id}`);

      // Verify it was written
      const { resource: verifyEvent } = await container.item(testEvent.id, testEvent.id).read();
      if (verifyEvent) {
        console.log('✅ Test event verified in database');
        
        // Clean up test event
        await container.item(testEvent.id, testEvent.id).delete();
        console.log('✅ Test event cleaned up');
      }

      console.log('\n✅ Cosmos DB is working correctly!');
      console.log('\nNext steps:');
      console.log('  1. Visit https://www.life-psychology.com.au');
      console.log('  2. Click "Book Now" button');
      console.log('  3. Re-run this script to verify tracking');
      
      return;
    }

    // Query 2: Count by event type
    console.log('\nEvent Types:');
    const typeQuery = `
      SELECT c.type, COUNT(1) as count 
      FROM c 
      GROUP BY c.type
    `;
    const { resources: typeResults } = await container.items
      .query(typeQuery)
      .fetchAll();

    typeResults.forEach(result => {
      console.log(`  ${result.type || 'unknown'}: ${result.count}`);
    });

    // Query 3: Count by variant
    console.log('\nVariants:');
    const variantQuery = `
      SELECT c.variant, COUNT(1) as count 
      FROM c 
      WHERE c.type = 'variant-allocation'
      GROUP BY c.variant
    `;
    const { resources: variantResults } = await container.items
      .query(variantQuery)
      .fetchAll();

    variantResults.forEach(result => {
      console.log(`  ${result.variant}: ${result.count}`);
    });

    // Query 4: Recent events
    console.log('\nRecent Events (last 10):');
    const recentQuery = `
      SELECT TOP 10 c.type, c.userId, c.testName, c.variant, c.timestamp 
      FROM c 
      ORDER BY c._ts DESC
    `;
    const { resources: recentResults } = await container.items
      .query(recentQuery)
      .fetchAll();

    if (recentResults.length > 0) {
      console.table(recentResults);
    } else {
      console.log('  No events found');
    }

    // Query 5: Conversion rate
    const allocationQuery = `
      SELECT VALUE COUNT(1) FROM c 
      WHERE c.type = 'variant-allocation'
    `;
    const { resources: allocationCount } = await container.items
      .query(allocationQuery)
      .fetchAll();

    const conversionQuery = `
      SELECT VALUE COUNT(1) FROM c 
      WHERE c.type = 'conversion-event'
    `;
    const { resources: conversionCount } = await container.items
      .query(conversionQuery)
      .fetchAll();

    const allocations = allocationCount[0] || 0;
    const conversions = conversionCount[0] || 0;
    const conversionRate = allocations > 0 ? ((conversions / allocations) * 100).toFixed(2) : '0.00';

    console.log('\n📈 Conversion Metrics:');
    console.log(`  Variant Allocations: ${allocations}`);
    console.log(`  Conversion Events: ${conversions}`);
    console.log(`  Conversion Rate: ${conversionRate}%`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tracking is operational!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

main().catch(console.error);
