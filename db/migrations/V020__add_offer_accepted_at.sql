-- =============================================================================
-- V020__add_offer_accepted_at.sql
-- Migration: Add offer_accepted_at timestamp column
-- =============================================================================

-- Add offer_accepted_at to track when an offer is accepted by the candidate
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'offer_accepted_at')
BEGIN
  ALTER TABLE applications ADD offer_accepted_at DATETIME2 NULL;
  PRINT 'Added offer_accepted_at column to applications';
END

PRINT 'V020 migration complete - offer_accepted_at field added';
