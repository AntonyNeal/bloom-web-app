-- Create A/B Test Events Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ab_test_events')
BEGIN
    CREATE TABLE ab_test_events (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        test_name NVARCHAR(255) NOT NULL,
        user_id NVARCHAR(255),
        session_id NVARCHAR(255) NOT NULL,
        variant NVARCHAR(255) NOT NULL,
        converted BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );

    -- Create indexes for queries
    CREATE INDEX idx_test_name ON ab_test_events(test_name);
    CREATE INDEX idx_test_variant ON ab_test_events(test_name, variant);
    CREATE INDEX idx_created_at ON ab_test_events(created_at);

    PRINT 'ab_test_events table created successfully';
END
ELSE
BEGIN
    PRINT 'ab_test_events table already exists';
END
