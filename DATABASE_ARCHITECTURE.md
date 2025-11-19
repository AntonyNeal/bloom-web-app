# Database Architecture & Integration Guide

## Overview

This document describes the complete database architecture for the Life Psychology application system, including the migration framework, type system, and application integration patterns.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Applications Layer                       │
│  (apps/bloom/*, apps/website/*)                             │
│  • React UI components                                       │
│  • Service layer (adminService.ts)                          │
│  • API integration                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Shared Types Layer                         │
│  (packages/shared-types/)                                   │
│  • Database entity interfaces (ApplicationEntity)            │
│  • DTO interfaces (ApplicationDTO, ApplicationDetailDTO)     │
│  • Type mappers & converters                                 │
│  • SQL query builders                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 Database Service Layer                       │
│  (packages/db-migrations/src/application-service.ts)        │
│  • ApplicationService class                                  │
│  • High-level CRUD operations                                │
│  • Entity/DTO conversion                                     │
│  • Transaction management                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│               Migration & Schema Layer                       │
│  (packages/db-migrations/)                                  │
│  • Migration runner                                          │
│  • SQL executor                                              │
│  • Cosmos executor                                           │
│  • Changelog tracking                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│  • Azure SQL Database (lpa-applications-db)                 │
│  • Azure Cosmos DB (lpa-ab-testing)                         │
│  • Azure Blob Storage (documents)                            │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Azure SQL Database - lpa-applications-db

#### Applications Table

**Purpose**: Store psychologist application submissions

```sql
CREATE TABLE Applications (
  -- Primary Key
  ApplicationID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  
  -- Personal Information
  FirstName NVARCHAR(100) NOT NULL,
  LastName NVARCHAR(100) NOT NULL,
  PreferredName NVARCHAR(100),
  Email NVARCHAR(255) NOT NULL,
  Phone NVARCHAR(20),
  
  -- Professional Credentials
  AHPRANumber NVARCHAR(50) NOT NULL,
  RegistrationType NVARCHAR(100),
  YearsRegistered INT,
  IsPhDHolder BIT DEFAULT 0,
  
  -- Practice Details
  CurrentClientBase INT,
  Specializations NVARCHAR(MAX),           -- JSON array
  TherapeuticApproaches NVARCHAR(MAX),     -- JSON array
  AgeGroupsServed NVARCHAR(MAX),           -- JSON array
  HasTelehealthExperience BIT DEFAULT 0,
  PreferredHoursPerWeek INT,
  AvailabilityFlexibility NVARCHAR(MAX),
  EarliestStartDate DATE,
  
  -- Insurance
  InsuranceProvider NVARCHAR(200),
  InsurancePolicyNumber NVARCHAR(100),
  InsuranceCoverageAmount DECIMAL(18,2),
  InsuranceExpiryDate DATE,
  
  -- References
  Reference1Name NVARCHAR(200),
  Reference1Relationship NVARCHAR(100),
  Reference1Contact NVARCHAR(255),
  Reference2Name NVARCHAR(200),
  Reference2Relationship NVARCHAR(100),
  Reference2Contact NVARCHAR(255),
  
  -- Application Management
  AdditionalNotes NVARCHAR(MAX),
  ApplicationStatus NVARCHAR(50) NOT NULL DEFAULT 'Submitted',
  SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  ReviewedAt DATETIME2,
  ReviewedBy NVARCHAR(100),
  ReviewNotes NVARCHAR(MAX),
  
  -- Indexes
  INDEX IX_Applications_Status (ApplicationStatus),
  INDEX IX_Applications_Email (Email),
  INDEX IX_Applications_SubmittedAt (SubmittedAt DESC),
  INDEX IX_Applications_AHPRANumber (AHPRANumber)
);
```

**Migrations**:
- `20251120T000000_initial_applications_schema.ts` - Creates table

#### ApplicationDocuments Table

**Purpose**: Store metadata for uploaded documents (PDFs stored in Blob Storage)

```sql
CREATE TABLE ApplicationDocuments (
  DocumentID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  ApplicationID UNIQUEIDENTIFIER NOT NULL,
  DocumentType NVARCHAR(100) NOT NULL,
  FileName NVARCHAR(500) NOT NULL,
  BlobName NVARCHAR(500) NOT NULL,
  FileSize INT NOT NULL,
  ContentType NVARCHAR(100) NOT NULL,
  UploadedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  
  -- Foreign Key
  CONSTRAINT FK_ApplicationDocuments_Applications 
    FOREIGN KEY (ApplicationID) 
    REFERENCES Applications(ApplicationID)
    ON DELETE CASCADE,
  
  -- Indexes
  INDEX IX_ApplicationDocuments_ApplicationID (ApplicationID),
  INDEX IX_ApplicationDocuments_DocumentType (DocumentType),
  INDEX IX_ApplicationDocuments_UploadedAt (UploadedAt DESC)
);
```

**Migrations**:
- `20251120T001000_create_application_documents.ts` - Creates table

#### DatabaseChangeLog Table

**Purpose**: Track applied migrations (managed by migration system)

```sql
CREATE TABLE DatabaseChangeLog (
  Id NVARCHAR(255) PRIMARY KEY,
  Description NVARCHAR(500),
  Timestamp DATETIME2,
  Author NVARCHAR(100),
  ExecutedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  ExecutionTime INT,
  Checksum NVARCHAR(64),
  Status NVARCHAR(20),
  ErrorMessage NVARCHAR(MAX)
);
```

### Azure Cosmos DB - lpa-ab-testing

#### ab-test-events Container

**Purpose**: Store A/B test event tracking

```typescript
{
  id: string,              // Document ID
  sessionId: string,       // Partition key
  variant: 'unified' | 'minimal',
  eventType: 'allocation' | 'page_view' | 'interaction' | 'conversion',
  eventData: object,
  timestamp: string,
  userAgent: string,
  _ts: number              // System timestamp
}
```

**Partition Key**: `/sessionId`  
**TTL**: Not set (retain indefinitely for analysis)

#### ab-test-metadata Container

**Purpose**: Store A/B test configuration

```typescript
{
  id: string,
  testName: string,
  variant: 'unified' | 'minimal',
  allocationRatio: number,
  isActive: boolean,
  createdAt: string,
  updatedAt: string,
  _ts: number
}
```

**Partition Key**: `/testName`

**Migrations**:
- `20251120T010000_create_ab_test_containers.ts` - Creates containers

## Type System

### Entity Types (Database Schema)

Located in `packages/shared-types/src/database.ts`:

```typescript
// Raw database entity (matches SQL schema exactly)
interface ApplicationEntity {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  // ... all database columns
  Specializations: string | null;  // JSON string in DB
  ApplicationStatus: ApplicationStatus;
  SubmittedAt: Date | string;
}

// Document entity
interface ApplicationDocumentEntity {
  DocumentID: string;
  ApplicationID: string;
  DocumentType: string;
  // ... document metadata
}

// A/B test entities
interface ABTestEventEntity { /* ... */ }
interface ABTestMetadataEntity { /* ... */ }
```

### DTO Types (API Responses)

```typescript
// Summary view (for list endpoints)
interface ApplicationDTO {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  ApplicationStatus: ApplicationStatus;
  SubmittedAt: string;
  // ... essential fields only
}

// Detail view (for single item endpoints)
interface ApplicationDetailDTO extends ApplicationDTO {
  Specializations: string[];  // Parsed JSON array
  // ... all fields, transformed for frontend
}
```

### Submission Types (API Requests)

```typescript
// For creating new applications
interface ApplicationSubmission {
  FirstName: string;
  LastName: string;
  Specializations: string[];  // Frontend sends array
  // ... user input fields
}

// For updating status
interface ApplicationStatusUpdate {
  status: ApplicationStatus;
  reviewedBy: string;
  reviewNotes?: string;
}
```

## Data Flow

### Creating an Application

```
1. Frontend (Bloom)
   └─> ApplicationSubmission (array format)
   
2. API Service
   └─> submissionToEntity() mapper
       └─> ApplicationEntity (JSON strings)
       
3. Database Service
   └─> ApplicationService.createApplication()
       └─> INSERT INTO Applications
       
4. Response
   └─> ApplicationID (GUID)
```

### Retrieving Applications

```
1. Frontend Request
   └─> GET /api/applications?status=Submitted
   
2. Database Service
   └─> ApplicationService.listApplications(filters)
       └─> SELECT with WHERE clause
       
3. Entity Mapping
   └─> ApplicationEntity[] from database
       └─> applicationEntityToDTO() mapper
           └─> ApplicationDTO[] (parsed arrays, formatted dates)
           
4. Frontend Receives
   └─> { applications: ApplicationDTO[], pagination: {...} }
```

## Service Layer Usage

### ApplicationService

Located in `packages/db-migrations/src/application-service.ts`:

```typescript
import { createApplicationService } from '@life-psychology/db-migrations';

// Initialize
const service = createApplicationService(process.env.SQL_CONNECTION_STRING!);
await service.connect();

// List applications
const result = await service.listApplications({
  status: 'Submitted',
  limit: 20,
  offset: 0
});
// Returns: PaginatedResponse<ApplicationDTO>

// Get single application
const app = await service.getApplicationById(id);
// Returns: ApplicationDetailDTO | null

// Create application
const submission: ApplicationSubmission = { /* ... */ };
const newId = await service.createApplication(submission);
// Returns: string (GUID)

// Update status
await service.updateApplicationStatus(id, {
  status: 'Approved',
  reviewedBy: 'admin@example.com',
  reviewNotes: 'Credentials verified'
});

// Get documents
const docs = await service.getApplicationDocuments(id);
// Returns: ApplicationDocumentDTO[]

// Statistics
const stats = await service.getStatistics();
// Returns: { total, byStatus, recentSubmissions }

// Cleanup
await service.disconnect();
```

## Integration Points

### Bloom Application (apps/bloom/)

**Current**: Uses `adminService.ts` with inline type definitions

**Updated**: Now imports shared types

```typescript
// apps/bloom/src/services/adminService.ts
import type {
  ApplicationDTO,
  ApplicationDetailDTO,
  ApplicationDocumentDTO,
} from '@life-psychology/shared-types';

// API functions use shared types
export const adminService = {
  async listApplications(status?: string): Promise<{ applications: ApplicationDTO[] }> {
    // Implementation uses shared ApplicationDTO type
  }
};
```

### Azure Functions (bloom-functions/ or apps/bloom/api/)

**Recommendation**: Use ApplicationService for database operations

```typescript
// In Azure Function
import { createApplicationService } from '@life-psychology/db-migrations';
import { ApplicationSubmission } from '@life-psychology/shared-types';

export async function submitApplication(context, req) {
  const service = createApplicationService(process.env.SQL_CONNECTION_STRING);
  await service.connect();
  
  try {
    const submission: ApplicationSubmission = req.body;
    const applicationId = await service.createApplication(submission);
    
    context.res = {
      status: 201,
      body: { applicationId }
    };
  } finally {
    await service.disconnect();
  }
}
```

### Website Application (apps/website/)

**Currently**: No direct database access (uses API calls)

**Integration**: Can use shared types for API request/response types

```typescript
// apps/website/src/services/applicationApi.ts
import type { ApplicationSubmission } from '@life-psychology/shared-types';

export async function submitApplication(data: ApplicationSubmission) {
  const response = await fetch('/api/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## Migration Workflow

### Running Migrations

```bash
# Check status
pnpm migrate:status

# Run all pending migrations
pnpm migrate

# Create new migration
pnpm migrate:create "add email verification field" --type sql --author "dev-team"
```

### Migration Example

```typescript
// migrations/sql/20251120T120000_add_email_verified.ts
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T120000_add_email_verified',
  description: 'Add EmailVerified field to Applications table',
  timestamp: '2025-11-20T12:00:00.000Z',
  author: 'dev-team',
  database: 'sql',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      ALTER TABLE Applications
      ADD EmailVerified BIT DEFAULT 0 NOT NULL,
          EmailVerifiedAt DATETIME2 NULL;
      
      CREATE INDEX IX_Applications_EmailVerified 
        ON Applications(EmailVerified);
    `);
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      DROP INDEX IX_Applications_EmailVerified ON Applications;
      
      ALTER TABLE Applications
      DROP COLUMN EmailVerified, EmailVerifiedAt;
    `);
  }
};

export default migration;
```

### After Migration: Update Types

1. **Update Entity Interface**:

```typescript
// packages/shared-types/src/database.ts
export interface ApplicationEntity {
  // ... existing fields
  EmailVerified: boolean;
  EmailVerifiedAt?: Date | string | null;
}
```

2. **Update DTO if needed**:

```typescript
export interface ApplicationDetailDTO extends ApplicationDTO {
  // ... existing fields
  EmailVerified: boolean;
  EmailVerifiedAt?: string;
}
```

3. **Rebuild packages**:

```bash
pnpm --filter @life-psychology/shared-types build
pnpm --filter @life-psychology/db-migrations build
```

## Best Practices

### 1. Type Safety

✅ **DO**:
- Import types from `@life-psychology/shared-types`
- Use entity types for database operations
- Use DTO types for API responses
- Use submission types for API requests

❌ **DON'T**:
- Define duplicate types in application code
- Use `any` for database results
- Mix entity and DTO types

### 2. Data Transformation

✅ **DO**:
- Use mapper functions from `shared-types/mappers`
- Convert JSON strings to arrays in DTOs
- Format dates as ISO strings in DTOs
- Handle null/undefined consistently

❌ **DON'T**:
- Send raw database entities to frontend
- Parse JSON manually
- Mix Date and string types

### 3. Database Operations

✅ **DO**:
- Use ApplicationService for high-level operations
- Use transactions for multi-table operations
- Use parameterized queries (prevents SQL injection)
- Close connections in finally blocks

❌ **DON'T**:
- Write raw SQL in application code
- Forget to close database connections
- Use string concatenation for queries

### 4. Migrations

✅ **DO**:
- Create migration before schema changes
- Implement both up() and down()
- Test rollback in development
- Update types after migration
- Document breaking changes

❌ **DON'T**:
- Modify applied migrations
- Skip migrations
- Forget to rebuild packages
- Deploy without testing migrations

## Testing Strategy

### Unit Tests

```typescript
// Test entity-to-DTO conversion
import { applicationEntityToDTO } from '@life-psychology/shared-types';

test('converts entity to DTO correctly', () => {
  const entity: ApplicationEntity = { /* ... */ };
  const dto = applicationEntityToDTO(entity);
  
  expect(dto.ApplicationID).toBe(entity.ApplicationID);
  expect(dto.SubmittedAt).toBeTypeOf('string');
});
```

### Integration Tests

```typescript
// Test ApplicationService
import { createApplicationService } from '@life-psychology/db-migrations';

test('creates application', async () => {
  const service = createApplicationService(testConnectionString);
  await service.connect();
  
  const submission: ApplicationSubmission = { /* ... */ };
  const id = await service.createApplication(submission);
  
  expect(id).toBeTruthy();
  
  const app = await service.getApplicationById(id);
  expect(app?.FirstName).toBe(submission.FirstName);
  
  await service.disconnect();
});
```

## Troubleshooting

### Type Errors After Migration

**Problem**: TypeScript errors after adding database column

**Solution**:
1. Update `ApplicationEntity` interface
2. Rebuild shared-types: `pnpm --filter @life-psychology/shared-types build`
3. Rebuild db-migrations: `pnpm --filter @life-psychology/db-migrations build`
4. Rebuild applications: `pnpm build`

### Mapper Issues

**Problem**: JSON parsing fails

**Solution**: Check database column has valid JSON string or NULL

```sql
-- Check for invalid JSON
SELECT ApplicationID, Specializations
FROM Applications
WHERE Specializations IS NOT NULL 
  AND Specializations NOT LIKE '[%]';
```

### Connection Issues

**Problem**: Cannot connect to database

**Solution**:
1. Check connection string in environment variables
2. Verify firewall rules allow your IP
3. Confirm credentials are correct
4. Test with Azure Data Studio or SQL Server Management Studio

## Next Steps

1. **Rebuild Packages**: `pnpm install && pnpm build`
2. **Run Migrations**: `pnpm migrate` (after configuring credentials)
3. **Update Azure Functions**: Migrate to ApplicationService
4. **Add Tests**: Create test suite for mappers and service
5. **Deploy**: Test in staging before production

## Related Documentation

- [Migration System Setup](../MIGRATION_SYSTEM_SETUP.md)
- [Migration Quick Reference](../MIGRATION_QUICK_REFERENCE.md)
- [Database Migration System Ready](../DB_MIGRATION_SYSTEM_READY.md)
