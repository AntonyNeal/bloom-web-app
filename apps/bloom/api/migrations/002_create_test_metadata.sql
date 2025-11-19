-- Create A/B Test Metadata Table for display labels
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ab_test_metadata')
BEGIN
    CREATE TABLE ab_test_metadata (
        test_name NVARCHAR(255) PRIMARY KEY,
        display_label NVARCHAR(500) NOT NULL,
        description NVARCHAR(1000),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );

    -- Insert default test labels
    INSERT INTO ab_test_metadata (test_name, display_label, description) VALUES
    ('homepage-header-test', 'Homepage Header Copy', 'Testing different headline variations on the landing page'),
    ('hero-cta-test', 'Hero Call-to-Action Button', 'Testing CTA button text and styling variations'),
    ('mobile-touch-test', 'Mobile Touch Interactions', 'Testing mobile-specific touch feedback and interactions'),
    ('form-fields-test', 'Application Form Fields', 'Testing form field layouts and input styles'),
    ('trust-badges-test', 'Trust Badges & Social Proof', 'Testing placement and style of trust indicators');

    PRINT 'ab_test_metadata table created and populated successfully';
END
ELSE
BEGIN
    PRINT 'ab_test_metadata table already exists';
END
