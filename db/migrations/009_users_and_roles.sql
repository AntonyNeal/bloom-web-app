-- Migration: 009_users_and_roles
-- Description: Separate users from practitioners, add roles
-- Created: 2026-01-29

-- ============================================
-- USERS (anyone who logs into Bloom)
-- ============================================
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    azure_ad_object_id NVARCHAR(100) UNIQUE NOT NULL,
    
    -- Basic info
    email NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100),
    last_name NVARCHAR(100),
    display_name NVARCHAR(255),
    
    -- Role
    role NVARCHAR(50) NOT NULL DEFAULT 'practitioner',  -- 'admin', 'practitioner', 'staff', 'viewer'
    
    -- Status
    is_active BIT DEFAULT 1,
    last_login_at DATETIME2,
    
    -- Timestamps
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_users_azure_ad ON users(azure_ad_object_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- ROLES REFERENCE
-- ============================================
-- admin:        Full access. BI, all data, user management, impersonation
-- practitioner: Access to their own clients, appointments, billing
-- staff:        Practice admin - scheduling, billing, reports (no clinical notes)
-- viewer:       Read-only BI access

-- ============================================
-- LINK PRACTITIONERS TO USERS
-- ============================================
ALTER TABLE practitioners ADD user_id UNIQUEIDENTIFIER REFERENCES users(id);
CREATE INDEX idx_practitioners_user ON practitioners(user_id);

-- ============================================
-- USER PERMISSIONS (granular, optional)
-- ============================================
CREATE TABLE user_permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    permission NVARCHAR(100) NOT NULL,  -- e.g., 'view_all_clients', 'manage_practitioners', 'view_bi'
    granted_at DATETIME2 DEFAULT GETDATE(),
    granted_by UNIQUEIDENTIFIER REFERENCES users(id),
    
    CONSTRAINT uq_user_permission UNIQUE (user_id, permission)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- ============================================
-- COMMON PERMISSIONS
-- ============================================
-- view_bi:              Access BI dashboards
-- manage_users:         Create/edit users
-- manage_practitioners: Approve applications, edit practitioners
-- view_all_clients:     See all clients (not just own)
-- view_all_billing:     See all invoices/payouts
-- impersonate:          Test as another user

-- ============================================
-- CREATE JULIAN'S USER RECORD
-- ============================================
INSERT INTO users (id, azure_ad_object_id, email, first_name, last_name, display_name, role)
VALUES (
    NEWID(),
    '03f17678-7885-4e63-9b95-86e0498db620',
    'julian@life-psychology.com.au',
    'Julian',
    'Della Bosca',
    'Julian Della Bosca',
    'admin'
);

-- Grant all permissions to Julian
DECLARE @julianUserId UNIQUEIDENTIFIER;
SELECT @julianUserId = id FROM users WHERE azure_ad_object_id = '03f17678-7885-4e63-9b95-86e0498db620';

INSERT INTO user_permissions (user_id, permission) VALUES
(@julianUserId, 'view_bi'),
(@julianUserId, 'manage_users'),
(@julianUserId, 'manage_practitioners'),
(@julianUserId, 'view_all_clients'),
(@julianUserId, 'view_all_billing'),
(@julianUserId, 'impersonate');

-- ============================================
-- UPDATE DASHBOARD API TO USE USERS TABLE
-- ============================================
-- The dashboard should check users table first, then check if user has a practitioner record
-- If admin/staff, show admin dashboard
-- If practitioner, show clinician dashboard

-- ============================================
-- MIGRATION RECORD
-- ============================================
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('009', 'users_and_roles', GETDATE());
