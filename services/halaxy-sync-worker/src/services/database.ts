/**
 * Database Service for Halaxy Sync Worker
 * 
 * Manages connections to Azure SQL and Cosmos DB
 */

import * as sql from 'mssql';
import { CosmosClient, Database as CosmosDatabase } from '@azure/cosmos';
import { config } from '../config';
import { trackDependency } from '../telemetry';

export interface Practitioner {
  id: string;
  halaxyPractitionerId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private sqlPool: sql.ConnectionPool | null = null;
  private cosmosClient: CosmosClient | null = null;
  private cosmosDb: CosmosDatabase | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ============================================================================
  // SQL Server Connection
  // ============================================================================

  public async getSqlPool(): Promise<sql.ConnectionPool> {
    if (!this.sqlPool) {
      const startTime = Date.now();
      try {
        this.sqlPool = await sql.connect(config.sqlConnectionString);
        
        trackDependency(
          'SQL',
          'connect',
          config.sqlConnectionString.substring(0, 50) + '...',
          Date.now() - startTime,
          true
        );

        console.log('[Database] SQL Server connected');
      } catch (error) {
        trackDependency(
          'SQL',
          'connect',
          config.sqlConnectionString.substring(0, 50) + '...',
          Date.now() - startTime,
          false
        );
        throw error;
      }
    }
    return this.sqlPool;
  }

  // ============================================================================
  // Cosmos DB Connection
  // ============================================================================

  public getCosmosDb(): CosmosDatabase | null {
    if (!config.cosmosConnectionString) {
      return null;
    }

    if (!this.cosmosClient) {
      this.cosmosClient = new CosmosClient(config.cosmosConnectionString);
      this.cosmosDb = this.cosmosClient.database('bloom-db');
      console.log('[Database] Cosmos DB connected');
    }

    return this.cosmosDb;
  }

  // ============================================================================
  // Test Connection
  // ============================================================================

  public async testConnection(): Promise<void> {
    const pool = await this.getSqlPool();
    const result = await pool.request().query('SELECT 1 as test');
    
    if (result.recordset[0].test !== 1) {
      throw new Error('SQL connection test failed');
    }
  }

  // ============================================================================
  // Practitioner Queries
  // ============================================================================

  public async getActivePractitioners(): Promise<Practitioner[]> {
    const pool = await this.getSqlPool();
    const startTime = Date.now();

    try {
      const result = await pool.request().query<{
        id: string;
        halaxy_practitioner_id: string;
        email: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
      }>(`
        SELECT 
          id,
          halaxy_practitioner_id,
          email,
          first_name,
          last_name,
          is_active
        FROM practitioners
        WHERE is_active = 1
          AND halaxy_practitioner_id IS NOT NULL
        ORDER BY last_name, first_name
      `);

      trackDependency(
        'SQL',
        'getActivePractitioners',
        'SELECT practitioners',
        Date.now() - startTime,
        true
      );

      return result.recordset.map(row => ({
        id: row.id,
        halaxyPractitionerId: row.halaxy_practitioner_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        isActive: row.is_active,
      }));

    } catch (error) {
      trackDependency(
        'SQL',
        'getActivePractitioners',
        'SELECT practitioners',
        Date.now() - startTime,
        false
      );

      // Return empty if table doesn't exist yet
      if ((error as Error).message?.includes('Invalid object name')) {
        console.log('[Database] Practitioners table not found - returning empty list');
        return [];
      }
      throw error;
    }
  }

  // ============================================================================
  // Sync Log (Cosmos DB)
  // ============================================================================

  public async logSync(entry: {
    practitionerId: string;
    syncType: 'full' | 'incremental';
    recordsProcessed: number;
    errors: number;
    duration: number;
    status: 'success' | 'failure';
  }): Promise<void> {
    const cosmosDb = this.getCosmosDb();
    if (!cosmosDb) {
      console.log('[Database] Cosmos DB not configured - skipping sync log');
      return;
    }

    try {
      const container = cosmosDb.container('sync-logs');
      await container.items.create({
        id: `${entry.practitionerId}-${Date.now()}`,
        partitionKey: entry.practitionerId,
        timestamp: new Date().toISOString(),
        ...entry,
      });
    } catch (error) {
      // Don't fail the sync just because logging failed
      console.error('[Database] Failed to log sync:', error);
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  public async close(): Promise<void> {
    if (this.sqlPool) {
      await this.sqlPool.close();
      this.sqlPool = null;
      console.log('[Database] SQL Server disconnected');
    }
    // Cosmos client doesn't need explicit close
    this.cosmosClient = null;
    this.cosmosDb = null;
  }
}

export default DatabaseService;
