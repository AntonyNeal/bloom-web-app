/**
 * Shared Database Connection Utility
 * 
 * Provides connection pooling for SQL Server connections.
 * Used by Halaxy sync service and other API functions.
 */

import * as sql from 'mssql';

// Connection pool singleton
let pool: sql.ConnectionPool | null = null;

/**
 * Get database configuration from environment variables
 */
export function getDbConfig(): string | sql.config {
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
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

/**
 * Get a database connection pool
 * Creates a new pool if one doesn't exist, otherwise returns existing pool
 */
export async function getDbConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const config = getDbConfig();
  pool = await sql.connect(config);
  
  pool.on('error', (err) => {
    console.error('[Database] Pool error:', err);
    pool = null;
  });

  return pool;
}

/**
 * Close the database connection pool
 */
export async function closeDbConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
