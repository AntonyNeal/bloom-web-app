/**
 * User Service
 * 
 * Handles user lookups and permissions.
 * Users are separate from practitioners - anyone who logs into Bloom.
 */

import * as sql from 'mssql';
import { getDbConnection } from './database';

export interface User {
  id: string;
  azure_ad_object_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  role: 'admin' | 'practitioner' | 'staff' | 'viewer';
  is_active: boolean;
  permissions?: string[];
}

export interface UserWithPractitioner extends User {
  practitioner_id?: string;
  halaxy_practitioner_id?: string;
  halaxy_practitioner_role_id?: string;
}

/**
 * Get user by Azure AD Object ID
 * Returns user info and optionally linked practitioner record
 */
export async function getUserByAzureId(azureAdObjectId: string): Promise<UserWithPractitioner | null> {
  try {
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .input('azureAdObjectId', sql.NVarChar, azureAdObjectId)
      .query(`
        SELECT 
          u.id,
          u.azure_ad_object_id,
          u.email,
          u.first_name,
          u.last_name,
          u.display_name,
          u.role,
          u.is_active,
          p.id as practitioner_id,
          p.halaxy_practitioner_id,
          p.halaxy_practitioner_role_id
        FROM users u
        LEFT JOIN practitioners p ON p.user_id = u.id AND p.is_active = 1
        WHERE u.azure_ad_object_id = @azureAdObjectId
          AND u.is_active = 1
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const user = result.recordset[0];
    
    // Get permissions
    const permResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, user.id)
      .query(`
        SELECT permission FROM user_permissions WHERE user_id = @userId
      `);
    
    user.permissions = permResult.recordset.map(r => r.permission);
    
    return user;
  } catch (error) {
    console.error('[getUserByAzureId] Database error:', error);
    throw error;
  }
}

/**
 * Create or update user on login
 * Called when user logs in via Azure AD
 */
export async function upsertUserOnLogin(
  azureAdObjectId: string,
  email: string,
  displayName?: string,
  firstName?: string,
  lastName?: string
): Promise<User> {
  try {
    const pool = await getDbConnection();
    
    // Check if user exists
    const existing = await pool.request()
      .input('azureAdObjectId', sql.NVarChar, azureAdObjectId)
      .query(`SELECT id, role FROM users WHERE azure_ad_object_id = @azureAdObjectId`);
    
    if (existing.recordset.length > 0) {
      // Update last login
      await pool.request()
        .input('azureAdObjectId', sql.NVarChar, azureAdObjectId)
        .query(`UPDATE users SET last_login_at = GETDATE() WHERE azure_ad_object_id = @azureAdObjectId`);
      
      return getUserByAzureId(azureAdObjectId) as Promise<User>;
    }
    
    // Create new user with default 'practitioner' role
    // Admins must be set manually in database
    const result = await pool.request()
      .input('azureAdObjectId', sql.NVarChar, azureAdObjectId)
      .input('email', sql.NVarChar, email)
      .input('firstName', sql.NVarChar, firstName || null)
      .input('lastName', sql.NVarChar, lastName || null)
      .input('displayName', sql.NVarChar, displayName || email)
      .query(`
        INSERT INTO users (id, azure_ad_object_id, email, first_name, last_name, display_name, role, last_login_at)
        OUTPUT INSERTED.id, INSERTED.role
        VALUES (NEWID(), @azureAdObjectId, @email, @firstName, @lastName, @displayName, 'practitioner', GETDATE())
      `);
    
    return getUserByAzureId(azureAdObjectId) as Promise<User>;
  } catch (error) {
    console.error('[upsertUserOnLogin] Database error:', error);
    throw error;
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: UserWithPractitioner, permission: string): boolean {
  // Admins have all permissions
  if (user.role === 'admin') return true;
  
  return user.permissions?.includes(permission) || false;
}

/**
 * Check if user can access practitioner dashboard
 */
export function canAccessPractitionerDashboard(user: UserWithPractitioner): boolean {
  return !!user.practitioner_id && !!user.halaxy_practitioner_id;
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(user: UserWithPractitioner): boolean {
  return user.role === 'admin' || user.role === 'staff' || hasPermission(user, 'view_bi');
}
