-- =============================================================================
-- V030__add_website_profile_fields.sql
-- Migration: Add fields for public website practitioner profiles
-- =============================================================================
-- These fields support the multi-clinician public website that builds itself
-- from the Bloom practitioner database.
-- =============================================================================

-- Add URL-friendly slug for practitioner pages (e.g., /team/zoe-semmler)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'url_slug')
BEGIN
    ALTER TABLE practitioners ADD url_slug NVARCHAR(100) NULL;
    PRINT 'Added url_slug column';
END
GO

-- Create unique index on url_slug for fast lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_practitioners_url_slug' AND object_id = OBJECT_ID('practitioners'))
BEGIN
    CREATE UNIQUE INDEX idx_practitioners_url_slug ON practitioners(url_slug) WHERE url_slug IS NOT NULL;
    PRINT 'Created unique index on url_slug';
END
GO

-- Add headline/tagline for practitioner cards
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'headline')
BEGIN
    ALTER TABLE practitioners ADD headline NVARCHAR(200) NULL;
    PRINT 'Added headline column';
END
GO

-- Add extended bio for public website (different from internal bio)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'bio_website')
BEGIN
    ALTER TABLE practitioners ADD bio_website NVARCHAR(MAX) NULL;
    PRINT 'Added bio_website column';
END
GO

-- Add qualifications display string (e.g., "MPsych (Clinical), MAPS")
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'qualifications_display')
BEGIN
    ALTER TABLE practitioners ADD qualifications_display NVARCHAR(500) NULL;
    PRINT 'Added qualifications_display column';
END
GO

-- Add accepting new clients flag
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'accepting_new_clients')
BEGIN
    ALTER TABLE practitioners ADD accepting_new_clients BIT NOT NULL DEFAULT 1;
    PRINT 'Added accepting_new_clients column';
END
GO

-- Add display order for team page sorting
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'display_order')
BEGIN
    ALTER TABLE practitioners ADD display_order INT NOT NULL DEFAULT 100;
    PRINT 'Added display_order column';
END
GO

-- Add therapy approaches (JSON array of approaches they use)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'therapy_approaches')
BEGIN
    ALTER TABLE practitioners ADD therapy_approaches NVARCHAR(MAX) NULL;
    PRINT 'Added therapy_approaches column (JSON array)';
END
GO

-- Add areas of focus / specialties for public display
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'areas_of_focus')
BEGIN
    ALTER TABLE practitioners ADD areas_of_focus NVARCHAR(MAX) NULL;
    PRINT 'Added areas_of_focus column (JSON array)';
END
GO

-- Add languages spoken
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'languages')
BEGIN
    ALTER TABLE practitioners ADD languages NVARCHAR(500) NULL DEFAULT '["English"]';
    PRINT 'Added languages column (JSON array)';
END
GO

-- Add session types offered (telehealth, in-person, etc.)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'session_types')
BEGIN
    ALTER TABLE practitioners ADD session_types NVARCHAR(MAX) NULL DEFAULT '["Telehealth"]';
    PRINT 'Added session_types column (JSON array)';
END
GO

-- Add Medicare provider status
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'medicare_provider')
BEGIN
    ALTER TABLE practitioners ADD medicare_provider BIT NOT NULL DEFAULT 1;
    PRINT 'Added medicare_provider column';
END
GO

-- Add NDIS registered status
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'ndis_registered')
BEGIN
    ALTER TABLE practitioners ADD ndis_registered BIT NOT NULL DEFAULT 0;
    PRINT 'Added ndis_registered column';
END
GO

PRINT 'V030 migration complete - website profile fields added';
