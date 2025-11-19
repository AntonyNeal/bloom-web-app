import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T000000_initial_applications_schema',
  description: 'Create initial Applications table with all required columns',
  timestamp: '2025-11-20T00:00:00.000Z',
  author: 'system',
  database: 'sql',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      -- Create Applications table if it doesn't exist
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Applications' AND xtype='U')
      BEGIN
        CREATE TABLE Applications (
          ApplicationID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          FirstName NVARCHAR(100) NOT NULL,
          LastName NVARCHAR(100) NOT NULL,
          PreferredName NVARCHAR(100),
          Email NVARCHAR(255) NOT NULL,
          Phone NVARCHAR(20),
          AHPRANumber NVARCHAR(50) NOT NULL,
          RegistrationType NVARCHAR(100),
          YearsRegistered INT,
          IsPhDHolder BIT DEFAULT 0,
          CurrentClientBase INT,
          Specializations NVARCHAR(MAX),
          TherapeuticApproaches NVARCHAR(MAX),
          AgeGroupsServed NVARCHAR(MAX),
          HasTelehealthExperience BIT DEFAULT 0,
          PreferredHoursPerWeek INT,
          AvailabilityFlexibility NVARCHAR(MAX),
          EarliestStartDate DATE,
          InsuranceProvider NVARCHAR(200),
          InsurancePolicyNumber NVARCHAR(100),
          InsuranceCoverageAmount DECIMAL(18,2),
          InsuranceExpiryDate DATE,
          Reference1Name NVARCHAR(200),
          Reference1Relationship NVARCHAR(100),
          Reference1Contact NVARCHAR(255),
          Reference2Name NVARCHAR(200),
          Reference2Relationship NVARCHAR(100),
          Reference2Contact NVARCHAR(255),
          AdditionalNotes NVARCHAR(MAX),
          ApplicationStatus NVARCHAR(50) NOT NULL DEFAULT 'Submitted',
          SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          ReviewedAt DATETIME2,
          ReviewedBy NVARCHAR(100),
          ReviewNotes NVARCHAR(MAX)
        );
        
        -- Create indexes
        CREATE INDEX IX_Applications_Status ON Applications(ApplicationStatus);
        CREATE INDEX IX_Applications_Email ON Applications(Email);
        CREATE INDEX IX_Applications_SubmittedAt ON Applications(SubmittedAt DESC);
        CREATE INDEX IX_Applications_AHPRANumber ON Applications(AHPRANumber);
        
        PRINT 'Applications table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'Applications table already exists';
      END
    `);
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      -- Drop indexes first
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_Status')
        DROP INDEX IX_Applications_Status ON Applications;
      
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_Email')
        DROP INDEX IX_Applications_Email ON Applications;
      
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_SubmittedAt')
        DROP INDEX IX_Applications_SubmittedAt ON Applications;
      
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_AHPRANumber')
        DROP INDEX IX_Applications_AHPRANumber ON Applications;
      
      -- Drop table
      IF EXISTS (SELECT * FROM sysobjects WHERE name='Applications' AND xtype='U')
      BEGIN
        DROP TABLE Applications;
        PRINT 'Applications table dropped successfully';
      END
    `);
  }
};

export default migration;
