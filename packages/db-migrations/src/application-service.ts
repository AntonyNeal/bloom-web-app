/**
 * Database Service Layer
 * 
 * High-level database operations for application management
 * Uses shared types and handles entity/DTO conversions
 */

import * as sql from 'mssql';
import type {
  ApplicationEntity,
  ApplicationDTO,
  ApplicationDetailDTO,
  ApplicationSubmission,
  ApplicationStatusUpdate,
  ApplicationFilters,
  PaginatedResponse,
  ApplicationDocumentEntity,
  ApplicationDocumentDTO,
} from '@shared/types';
import {
  applicationEntityToDTO,
  applicationEntityToDetailDTO,
  submissionToEntity,
  documentEntityToDTO,
  buildApplicationWhereClause,
  buildInsertColumns,
  buildUpdateSetClause,
} from '@shared/types';

export class ApplicationService {
  private pool: sql.ConnectionPool;

  constructor(connectionString: string) {
    this.pool = new sql.ConnectionPool(connectionString);
  }

  async connect(): Promise<void> {
    await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.close();
  }

  /**
   * List applications with optional filtering and pagination
   */
  async listApplications(filters: ApplicationFilters = {}): Promise<PaginatedResponse<ApplicationDTO>> {
    const { whereClause, parameters } = buildApplicationWhereClause(filters);
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM Applications ${whereClause}`;
    const countRequest = this.pool.request();
    Object.entries(parameters).forEach(([key, value]) => {
      countRequest.input(key, value);
    });
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        ApplicationID, FirstName, LastName, Email, Phone,
        AHPRANumber, RegistrationType, YearsRegistered,
        ApplicationStatus, SubmittedAt, ReviewedAt, ReviewedBy
      FROM Applications
      ${whereClause}
      ORDER BY SubmittedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const dataRequest = this.pool.request();
    Object.entries(parameters).forEach(([key, value]) => {
      dataRequest.input(key, value);
    });
    dataRequest.input('offset', offset);
    dataRequest.input('limit', limit);
    
    const dataResult = await dataRequest.query<ApplicationEntity>(dataQuery);
    const data = dataResult.recordset.map(applicationEntityToDTO);

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get application by ID with full details
   */
  async getApplicationById(id: string): Promise<ApplicationDetailDTO | null> {
    const query = `
      SELECT * FROM Applications
      WHERE ApplicationID = @id
    `;
    
    const result = await this.pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query<ApplicationEntity>(query);

    if (result.recordset.length === 0) {
      return null;
    }

    return applicationEntityToDetailDTO(result.recordset[0]);
  }

  /**
   * Create new application
   */
  async createApplication(submission: ApplicationSubmission): Promise<string> {
    const entity = submissionToEntity(submission);
    const { columns, values, parameters } = buildInsertColumns(entity);

    const query = `
      INSERT INTO Applications (ApplicationID, ${columns}, SubmittedAt)
      OUTPUT INSERTED.ApplicationID
      VALUES (NEWID(), ${values}, GETUTCDATE())
    `;

    const request = this.pool.request();
    Object.entries(parameters).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result.recordset[0].ApplicationID;
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: string,
    update: ApplicationStatusUpdate
  ): Promise<void> {
    const { setClause, parameters } = buildUpdateSetClause({
      ApplicationStatus: update.status,
      ReviewedBy: update.reviewedBy,
      ReviewNotes: update.reviewNotes,
      ReviewedAt: new Date(),
    });

    const query = `
      UPDATE Applications
      SET ${setClause}
      WHERE ApplicationID = @id
    `;

    const request = this.pool.request();
    request.input('id', sql.UniqueIdentifier, id);
    Object.entries(parameters).forEach(([key, value]) => {
      request.input(key, value);
    });

    await request.query(query);
  }

  /**
   * Get documents for an application
   */
  async getApplicationDocuments(applicationId: string): Promise<ApplicationDocumentDTO[]> {
    const query = `
      SELECT 
        DocumentID, ApplicationID, DocumentType, FileName,
        BlobName, FileSize, ContentType, UploadedAt
      FROM ApplicationDocuments
      WHERE ApplicationID = @applicationId
      ORDER BY UploadedAt DESC
    `;

    const result = await this.pool.request()
      .input('applicationId', sql.UniqueIdentifier, applicationId)
      .query<ApplicationDocumentEntity>(query);

    return result.recordset.map(documentEntityToDTO);
  }

  /**
   * Add document reference to database
   */
  async addDocument(document: Omit<ApplicationDocumentEntity, 'DocumentID' | 'UploadedAt'>): Promise<string> {
    const query = `
      INSERT INTO ApplicationDocuments (
        DocumentID, ApplicationID, DocumentType, FileName,
        BlobName, FileSize, ContentType, UploadedAt
      )
      OUTPUT INSERTED.DocumentID
      VALUES (
        NEWID(), @applicationId, @documentType, @fileName,
        @blobName, @fileSize, @contentType, GETUTCDATE()
      )
    `;

    const result = await this.pool.request()
      .input('applicationId', sql.UniqueIdentifier, document.ApplicationID)
      .input('documentType', sql.NVarChar(100), document.DocumentType)
      .input('fileName', sql.NVarChar(500), document.FileName)
      .input('blobName', sql.NVarChar(500), document.BlobName)
      .input('fileSize', sql.Int, document.FileSize)
      .input('contentType', sql.NVarChar(100), document.ContentType)
      .query(query);

    return result.recordset[0].DocumentID;
  }

  /**
   * Delete application and related documents
   */
  async deleteApplication(id: string): Promise<void> {
    const transaction = new sql.Transaction(this.pool);
    await transaction.begin();

    try {
      // Delete documents first
      await transaction.request()
        .input('applicationId', sql.UniqueIdentifier, id)
        .query('DELETE FROM ApplicationDocuments WHERE ApplicationID = @applicationId');

      // Delete application
      await transaction.request()
        .input('applicationId', sql.UniqueIdentifier, id)
        .query('DELETE FROM Applications WHERE ApplicationID = @applicationId');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recentSubmissions: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN SubmittedAt >= DATEADD(day, -7, GETUTCDATE()) THEN 1 END) as recentSubmissions
      FROM Applications
    `;

    const statusQuery = `
      SELECT ApplicationStatus, COUNT(*) as count
      FROM Applications
      GROUP BY ApplicationStatus
    `;

    const [statsResult, statusResult] = await Promise.all([
      this.pool.request().query(statsQuery),
      this.pool.request().query(statusQuery),
    ]);

    const byStatus: Record<string, number> = {};
    statusResult.recordset.forEach(row => {
      byStatus[row.ApplicationStatus] = row.count;
    });

    return {
      total: statsResult.recordset[0].total,
      recentSubmissions: statsResult.recordset[0].recentSubmissions,
      byStatus,
    };
  }
}

/**
 * Factory function to create ApplicationService instance
 */
export function createApplicationService(connectionString: string): ApplicationService {
  return new ApplicationService(connectionString);
}
