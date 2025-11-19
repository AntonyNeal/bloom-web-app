import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T001000_create_application_documents',
  description: 'Create ApplicationDocuments table for storing document metadata',
  timestamp: '2025-11-20T00:10:00.000Z',
  author: 'system',
  database: 'sql',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      -- Create ApplicationDocuments table if it doesn't exist
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ApplicationDocuments' AND xtype='U')
      BEGIN
        CREATE TABLE ApplicationDocuments (
          DocumentID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          ApplicationID UNIQUEIDENTIFIER NOT NULL,
          DocumentType NVARCHAR(100) NOT NULL,
          FileName NVARCHAR(500) NOT NULL,
          BlobName NVARCHAR(500) NOT NULL,
          FileSize INT NOT NULL,
          ContentType NVARCHAR(100) NOT NULL,
          UploadedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          
          -- Foreign key relationship
          CONSTRAINT FK_ApplicationDocuments_Applications 
            FOREIGN KEY (ApplicationID) 
            REFERENCES Applications(ApplicationID)
            ON DELETE CASCADE
        );
        
        -- Create indexes for performance
        CREATE INDEX IX_ApplicationDocuments_ApplicationID 
          ON ApplicationDocuments(ApplicationID);
        
        CREATE INDEX IX_ApplicationDocuments_DocumentType 
          ON ApplicationDocuments(DocumentType);
        
        CREATE INDEX IX_ApplicationDocuments_UploadedAt 
          ON ApplicationDocuments(UploadedAt DESC);
        
        PRINT 'ApplicationDocuments table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'ApplicationDocuments table already exists';
      END
    `);
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      -- Drop indexes first
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ApplicationDocuments_ApplicationID')
        DROP INDEX IX_ApplicationDocuments_ApplicationID ON ApplicationDocuments;
      
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ApplicationDocuments_DocumentType')
        DROP INDEX IX_ApplicationDocuments_DocumentType ON ApplicationDocuments;
      
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ApplicationDocuments_UploadedAt')
        DROP INDEX IX_ApplicationDocuments_UploadedAt ON ApplicationDocuments;
      
      -- Drop table
      IF EXISTS (SELECT * FROM sysobjects WHERE name='ApplicationDocuments' AND xtype='U')
      BEGIN
        DROP TABLE ApplicationDocuments;
        PRINT 'ApplicationDocuments table dropped successfully';
      END
    `);
  }
};

export default migration;
