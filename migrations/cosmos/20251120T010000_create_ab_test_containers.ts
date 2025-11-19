import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T010000_create_ab_test_containers',
  description: 'Create Cosmos DB containers for A/B testing data',
  timestamp: '2025-11-20T01:00:00.000Z',
  author: 'system',
  database: 'cosmos',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    
    // Create ab-test-events container
    await database.containers.createIfNotExists({
      id: 'ab-test-events',
      partitionKey: { paths: ['/testId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [
          { path: '/timestamp/?' },
          { path: '/userId/?' },
          { path: '/variant/?' },
          { path: '/eventType/?' }
        ]
      }
    });
    
    // Create ab-test-metadata container
    await database.containers.createIfNotExists({
      id: 'ab-test-metadata',
      partitionKey: { paths: ['/id'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [
          { path: '/status/?' },
          { path: '/startDate/?' },
          { path: '/endDate/?' }
        ]
      }
    });
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    
    // Delete containers
    await database.container('ab-test-events').delete();
    await database.container('ab-test-metadata').delete();
  }
};

export default migration;
