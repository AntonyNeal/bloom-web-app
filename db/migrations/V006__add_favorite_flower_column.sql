-- ============================================================================
-- Migration: Add favorite_flower column to applications table
-- Author: Zoe's secret intel feature
-- Date: 2026-01-09
-- ============================================================================

-- Add the favorite_flower column to applications table
ALTER TABLE applications
ADD favorite_flower NVARCHAR(100) NULL;

PRINT '✅ Added favorite_flower column to applications table';
GO
