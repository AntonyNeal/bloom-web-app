-- ============================================================================
-- V035: Clients Table - Standalone Patient Database
-- ============================================================================
-- Creates clients table for Bloom standalone practice management.
-- Stores basic demographics only (no sensitive clinical data).
-- Replaces dependency on Halaxy for patient records.
-- ============================================================================

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'clients')
BEGIN
    PRINT 'V035: Clients table already exists, skipping';
END
ELSE
BEGIN

CREATE TABLE clients (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Practitioner ownership
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Basic demographics (non-sensitive)
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    preferred_name NVARCHAR(100) NULL,
    
    -- Contact information
    email NVARCHAR(255) NULL,
    phone NVARCHAR(20) NULL,
    
    -- Demographics
    date_of_birth DATE NULL,
    gender NVARCHAR(20) NULL CHECK (gender IN ('male', 'female', 'non-binary', 'other', 'prefer-not-to-say', NULL)),
    
    -- Address (for invoicing, not clinical)
    street_address NVARCHAR(255) NULL,
    suburb NVARCHAR(100) NULL,
    state NVARCHAR(50) NULL,
    postcode NVARCHAR(10) NULL,
    country NVARCHAR(100) DEFAULT 'Australia',
    
    -- Medicare details (for billing only)
    medicare_number NVARCHAR(20) NULL,
    medicare_reference_number NVARCHAR(2) NULL,
    medicare_expiry_date DATE NULL,
    
    -- NDIS details (for billing only)
    ndis_number NVARCHAR(50) NULL,
    
    -- Import tracking
    halaxy_patient_id NVARCHAR(100) NULL,  -- Original Halaxy ID for reference
    imported_from_halaxy BIT NOT NULL DEFAULT 0,
    imported_at DATETIME2 NULL,
    
    -- Status
    is_active BIT NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Soft delete
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    
    -- Foreign key
    CONSTRAINT FK_clients_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

-- Index for practitioner lookup (most common query)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_clients_practitioner')
CREATE INDEX IX_clients_practitioner 
    ON clients(practitioner_id, is_deleted, is_active)
    INCLUDE (first_name, last_name, email);

-- Index for email lookup (unique per practitioner)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_clients_email')
CREATE INDEX IX_clients_email 
    ON clients(practitioner_id, email)
    WHERE email IS NOT NULL AND is_deleted = 0;

-- Index for phone lookup
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_clients_phone')
CREATE INDEX IX_clients_phone 
    ON clients(practitioner_id, phone)
    WHERE phone IS NOT NULL AND is_deleted = 0;

-- Index for Halaxy import tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_clients_halaxy_id')
CREATE INDEX IX_clients_halaxy_id 
    ON clients(halaxy_patient_id)
    WHERE halaxy_patient_id IS NOT NULL;

-- Index for name search
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_clients_name')
CREATE INDEX IX_clients_name 
    ON clients(practitioner_id, last_name, first_name)
    WHERE is_deleted = 0;

END -- End of IF NOT EXISTS block

PRINT 'V035: Clients table created successfully';
