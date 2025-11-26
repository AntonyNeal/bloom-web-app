-- ============================================================================
-- Migration: V3__add_session_tracking.sql
-- Description: Add session duration tracking for applications
-- Author: System
-- Date: 2025-11-27
-- ============================================================================

-- Add session tracking columns to applications
ALTER TABLE applications
ADD session_start_time DATETIME2,
    session_end_time DATETIME2,
    session_duration_seconds INT;

-- Index for session analytics
CREATE INDEX idx_session_duration ON applications(session_duration_seconds);
CREATE INDEX idx_session_start ON applications(session_start_time DESC);

-- View for session analytics
GO
CREATE VIEW vw_session_analytics AS
SELECT 
  DATE(created_at) as submission_date,
  COUNT(*) as total_submissions,
  AVG(session_duration_seconds) as avg_session_seconds,
  MIN(session_duration_seconds) as min_session_seconds,
  MAX(session_duration_seconds) as max_session_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY session_duration_seconds) 
    OVER() as median_session_seconds
FROM applications
WHERE session_duration_seconds IS NOT NULL
GROUP BY DATE(created_at);
GO
