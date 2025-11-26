-- ============================================================================
-- Migration: V2__add_ab_testing.sql
-- Description: Add A/B testing infrastructure for landing page variants
-- Author: System
-- Date: 2025-11-27
-- ============================================================================

-- A/B Test Metadata (Test Definitions)
CREATE TABLE ab_test_metadata (
  test_name NVARCHAR(255) PRIMARY KEY,
  display_label NVARCHAR(500) NOT NULL,
  description NVARCHAR(1000),
  started_at DATETIME2,
  expected_duration_days INT,
  status NVARCHAR(50) DEFAULT 'running',
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- A/B Test Variants
CREATE TABLE ab_test_variants (
  id INT PRIMARY KEY IDENTITY(1,1),
  test_name NVARCHAR(100) NOT NULL,
  variant_name NVARCHAR(50) NOT NULL,
  description NVARCHAR(MAX),
  is_active BIT DEFAULT 1,
  traffic_percentage DECIMAL(5,2) DEFAULT 50.00,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT uk_test_variant UNIQUE (test_name, variant_name),
  CONSTRAINT fk_test_metadata FOREIGN KEY (test_name) REFERENCES ab_test_metadata(test_name)
);

-- A/B Test Events (page views, clicks, conversions)
CREATE TABLE ab_test_events (
  id INT PRIMARY KEY IDENTITY(1,1),
  session_id NVARCHAR(100) NOT NULL,
  variant_id INT NOT NULL,
  event_type NVARCHAR(50) NOT NULL, -- 'view', 'click', 'conversion'
  event_data NVARCHAR(MAX), -- JSON for additional context
  user_agent NVARCHAR(500),
  ip_address NVARCHAR(50),
  created_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_variant FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id)
);

-- Indexes for performance
CREATE INDEX idx_variant_id ON ab_test_events(variant_id);
CREATE INDEX idx_event_type ON ab_test_events(event_type);
CREATE INDEX idx_session_id ON ab_test_events(session_id);
CREATE INDEX idx_created_at_events ON ab_test_events(created_at DESC);
CREATE INDEX idx_test_status ON ab_test_metadata(status);

-- Update trigger for metadata
GO
CREATE TRIGGER trg_ab_test_metadata_updated_at
ON ab_test_metadata
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ab_test_metadata
    SET updated_at = GETUTCDATE()
    FROM ab_test_metadata m
    INNER JOIN inserted i ON m.test_name = i.test_name;
END;
GO

-- Update trigger for variants
GO
CREATE TRIGGER trg_ab_test_variants_updated_at
ON ab_test_variants
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ab_test_variants
    SET updated_at = GETDATE()
    FROM ab_test_variants v
    INNER JOIN inserted i ON v.id = i.id;
END;
GO

-- Insert default test configurations
INSERT INTO ab_test_metadata (test_name, display_label, description, started_at, expected_duration_days, status) VALUES
('homepage-header-test', 'Homepage Header Copy', 'Testing different headline variations on the landing page', DATEADD(day, -3, GETUTCDATE()), 14, 'running'),
('hero-cta-test', 'Hero Call-to-Action Button', 'Testing CTA button text and styling variations', DATEADD(day, -2, GETUTCDATE()), 14, 'running'),
('mobile-touch-test', 'Mobile Touch Interactions', 'Testing mobile-specific touch feedback and interactions', DATEADD(day, -5, GETUTCDATE()), 21, 'running'),
('form-fields-test', 'Application Form Fields', 'Testing form field layouts and input styles', DATEADD(day, -1, GETUTCDATE()), 14, 'running'),
('trust-badges-test', 'Trust Badges & Social Proof', 'Testing placement and style of trust indicators', DATEADD(day, -4, GETUTCDATE()), 10, 'running');

