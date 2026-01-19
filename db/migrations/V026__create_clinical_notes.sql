-- ============================================================================
-- V026: Clinical Notes System
-- ============================================================================
-- Implements encrypted clinical notes with practitioner-only access.
-- Notes are encrypted with per-practitioner keys stored in Azure Key Vault.
-- Practice owner has NO access to note content - only metadata for compliance.
-- ============================================================================

-- Clinical Notes table
-- Note content is encrypted with practitioner's Key Vault key
CREATE TABLE clinical_notes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Ownership
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    patient_halaxy_id NVARCHAR(100) NOT NULL,  -- Reference to Halaxy patient
    
    -- Link to appointment (optional - notes can be standalone)
    appointment_halaxy_id NVARCHAR(100) NULL,
    session_date DATE NOT NULL,
    
    -- Note classification
    note_type NVARCHAR(50) NOT NULL CHECK (note_type IN (
        'intake',           -- Initial assessment
        'progress',         -- Regular session note
        'discharge',        -- Treatment completion
        'correspondence',   -- Letters, referrals
        'supervision',      -- Supervision notes
        'other'
    )),
    
    -- Encrypted content (encrypted by browser before reaching server)
    -- Stored as JSON: { ciphertext, iv, algorithm, keyVersion }
    encrypted_content NVARCHAR(MAX) NOT NULL,
    encryption_key_version NVARCHAR(100) NOT NULL,  -- Key Vault key version used
    
    -- Metadata (visible to practice owner for compliance)
    -- These are NOT encrypted - needed for audit and records management
    patient_initials NVARCHAR(10) NOT NULL,    -- e.g., "JM" for records list
    word_count INT NOT NULL DEFAULT 0,          -- Rough indicator of note length
    
    -- Note locking (clinical integrity - notes lock after edit window)
    is_locked BIT NOT NULL DEFAULT 0,
    locked_at DATETIME2 NULL,
    locked_reason NVARCHAR(100) NULL,  -- 'auto_24h', 'manual', 'exported'
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Soft delete (notes should never be hard deleted for compliance)
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    deleted_reason NVARCHAR(255) NULL,
    
    -- Foreign key
    CONSTRAINT FK_clinical_notes_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

-- Index for practitioner lookup (most common query)
CREATE INDEX IX_clinical_notes_practitioner 
    ON clinical_notes(practitioner_id, is_deleted) 
    INCLUDE (patient_halaxy_id, session_date, note_type);

-- Index for patient lookup (within practitioner's notes)
CREATE INDEX IX_clinical_notes_patient 
    ON clinical_notes(practitioner_id, patient_halaxy_id, is_deleted)
    INCLUDE (session_date, note_type);

-- Index for session date queries
CREATE INDEX IX_clinical_notes_session_date 
    ON clinical_notes(practitioner_id, session_date DESC, is_deleted);


-- ============================================================================
-- Audit Log for Clinical Notes
-- ============================================================================
-- Every access, modification, or export is logged for compliance
-- This is visible to practice owner for audit purposes

CREATE TABLE clinical_notes_audit (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- What was accessed
    note_id UNIQUEIDENTIFIER NOT NULL,
    
    -- What happened
    action NVARCHAR(50) NOT NULL CHECK (action IN (
        'created',
        'viewed',
        'updated',
        'locked',
        'exported',
        'export_patient',   -- Exported for patient
        'export_bulk',      -- Bulk export
        'deleted'
    )),
    
    -- Who did it
    performed_by UNIQUEIDENTIFIER NOT NULL,  -- practitioner_id
    performed_by_azure_oid NVARCHAR(100) NOT NULL,  -- Azure AD Object ID
    
    -- When and where
    performed_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ip_address NVARCHAR(50) NULL,
    user_agent NVARCHAR(500) NULL,
    
    -- Additional context
    details NVARCHAR(MAX) NULL,  -- JSON with any extra info
    
    -- Foreign key
    CONSTRAINT FK_clinical_notes_audit_note 
        FOREIGN KEY (note_id) REFERENCES clinical_notes(id)
);

-- Index for audit queries
CREATE INDEX IX_clinical_notes_audit_note 
    ON clinical_notes_audit(note_id, performed_at DESC);

CREATE INDEX IX_clinical_notes_audit_practitioner 
    ON clinical_notes_audit(performed_by, performed_at DESC);


-- ============================================================================
-- Practitioner Encryption Keys Reference
-- ============================================================================
-- Stores the wrapped DEK (Data Encryption Key) for each practitioner
-- The DEK is wrapped with their RSA key in Azure Key Vault
-- Only they can unwrap it (via Key Vault RBAC tied to their Azure AD)

CREATE TABLE practitioner_encryption_keys (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    azure_object_id NVARCHAR(100) NOT NULL,    -- Azure AD Object ID
    
    -- Key Vault reference
    key_name NVARCHAR(100) NOT NULL,           -- e.g., "notes-key-{azure_oid}"
    key_version NVARCHAR(100) NOT NULL,        -- Key Vault key version
    
    -- Wrapped DEK (encrypted with Key Vault RSA key)
    -- Only the practitioner can unwrap this via Key Vault
    wrapped_dek NVARCHAR(MAX) NOT NULL,        -- Base64 encoded
    
    -- Status
    is_active BIT NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    last_used_at DATETIME2 NULL,
    deactivated_at DATETIME2 NULL,
    
    -- Foreign key
    CONSTRAINT FK_practitioner_encryption_keys_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

-- Index for lookup by practitioner
CREATE INDEX IX_practitioner_encryption_keys_practitioner 
    ON practitioner_encryption_keys(practitioner_id, is_active);


-- ============================================================================
-- Patient Records Export Log
-- ============================================================================
-- Tracks when notes were exported for patients (compliance requirement)

CREATE TABLE patient_records_exports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Who requested and for whom
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    patient_halaxy_id NVARCHAR(100) NOT NULL,
    
    -- What was exported
    notes_count INT NOT NULL,
    date_range_start DATE NULL,
    date_range_end DATE NULL,
    export_format NVARCHAR(50) NOT NULL CHECK (export_format IN (
        'pdf',
        'encrypted_zip',
        'print'
    )),
    
    -- How it was delivered
    delivery_method NVARCHAR(50) NOT NULL CHECK (delivery_method IN (
        'download',         -- Practitioner downloaded
        'email_patient',    -- Emailed directly to patient
        'secure_link',      -- Generated secure download link
        'print'             -- Printed for patient
    )),
    delivery_destination NVARCHAR(255) NULL,  -- Email or note about delivery
    
    -- When
    exported_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign key
    CONSTRAINT FK_patient_records_exports_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

CREATE INDEX IX_patient_records_exports_patient 
    ON patient_records_exports(patient_halaxy_id, exported_at DESC);


-- ============================================================================
-- Add notes capability flag to practitioners table
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('practitioners') AND name = 'notes_enabled'
)
BEGIN
    ALTER TABLE practitioners ADD notes_enabled BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('practitioners') AND name = 'notes_key_created_at'
)
BEGIN
    ALTER TABLE practitioners ADD notes_key_created_at DATETIME2 NULL;
END
