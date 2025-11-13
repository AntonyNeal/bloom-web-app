-- Add cover_letter column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('applications') 
    AND name = 'cover_letter'
)
BEGIN
    ALTER TABLE applications 
    ADD cover_letter NVARCHAR(MAX) NULL;
    PRINT 'Added cover_letter column';
END
ELSE
BEGIN
    PRINT 'cover_letter column already exists';
END
GO
