-- Run this migration to add test metadata table with display labels
-- This should be run after 001_create_ab_test_events.sql

-- Execute the migration
:r 002_create_test_metadata.sql

-- Verify the table was created
SELECT * FROM ab_test_metadata;

-- You can add more test metadata here as needed:
-- INSERT INTO ab_test_metadata (test_name, display_label, description) 
-- VALUES ('your-test-name', 'Your Display Label', 'Your description');
