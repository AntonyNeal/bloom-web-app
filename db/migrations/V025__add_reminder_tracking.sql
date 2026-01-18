-- Migration V025: Add reminder tracking table
-- Tracks which appointment reminders have been sent to prevent duplicates

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reminder_sent')
BEGIN
  CREATE TABLE reminder_sent (
    id INT PRIMARY KEY IDENTITY(1,1),
    appointment_id NVARCHAR(100) NOT NULL,
    reminder_type NVARCHAR(20) NOT NULL,  -- '24h_patient', '24h_clinician', '1h_clinician', '1h_admin'
    recipient_type NVARCHAR(20) NOT NULL, -- 'patient', 'clinician', 'admin'
    sent_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Prevent duplicate reminders
    CONSTRAINT UQ_reminder_sent UNIQUE (appointment_id, reminder_type, recipient_type)
  );
  
  CREATE INDEX IX_reminder_sent_appointment ON reminder_sent(appointment_id);
  CREATE INDEX IX_reminder_sent_date ON reminder_sent(sent_at);
  
  PRINT 'Created reminder_sent table';
END
GO

PRINT 'V025 migration complete';
