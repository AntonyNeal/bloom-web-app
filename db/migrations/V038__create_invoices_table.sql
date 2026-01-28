-- ============================================================================
-- V038: Invoices Table - Basic Billing
-- ============================================================================
-- Stores invoices for completed appointments.
-- Will integrate with Proda when available.
-- ============================================================================

CREATE TABLE invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Relationships
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    client_id UNIQUEIDENTIFIER NOT NULL,
    appointment_id UNIQUEIDENTIFIER NULL,  -- Can be NULL for manual invoices
    
    -- Invoice details
    invoice_number NVARCHAR(50) NOT NULL,  -- Human-readable number (INV-2025-001)
    invoice_date DATE NOT NULL,
    due_date DATE NULL,
    
    -- Item: appointment or service
    description NVARCHAR(MAX) NOT NULL,
    appointment_type NVARCHAR(50) NULL,
    session_date DATE NULL,
    
    -- Amounts (in AUD cents, e.g., 1500 = $15.00)
    amount_cents INT NOT NULL,
    
    -- Medicare billing
    medicare_item_code NVARCHAR(10) NULL,  -- e.g., '80100' for psychologist session
    medicare_rebate_cents INT NOT NULL DEFAULT 0,  -- Amount covered by Medicare
    patient_gap_cents INT NOT NULL DEFAULT 0,  -- Patient out-of-pocket
    
    -- NDIS billing
    ndis_support_id NVARCHAR(50) NULL,  -- NDIS support category
    
    -- Status
    status NVARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',            -- Not yet sent
        'issued',           -- Sent to client
        'paid',             -- Payment received
        'overdue',          -- Past due date
        'cancelled',        -- Cancelled
        'refunded'          -- Refunded
    )),
    
    -- Payment tracking
    payment_date DATE NULL,
    payment_method NVARCHAR(50) NULL CHECK (payment_method IN ('bank-transfer', 'credit-card', 'cash', 'eftpos', 'other', NULL)),
    payment_reference NVARCHAR(255) NULL,
    
    -- Proda (future)
    proda_claim_id NVARCHAR(100) NULL,  -- ID from Proda once integrated
    proda_status NVARCHAR(50) NULL,  -- 'pending', 'submitted', 'accepted', 'rejected'
    
    -- Notes
    notes NVARCHAR(MAX) NULL,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Soft delete
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    
    -- Foreign keys
    CONSTRAINT FK_invoices_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id),
    CONSTRAINT FK_invoices_client 
        FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT FK_invoices_appointment 
        FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Index for invoice lookup
CREATE INDEX IX_invoices_invoice_number 
    ON invoices(invoice_number, is_deleted)
    INCLUDE (status, invoice_date);

-- Index for client invoices
CREATE INDEX IX_invoices_client 
    ON invoices(client_id, is_deleted, invoice_date)
    INCLUDE (status);

-- Index for practitioner financial reports
CREATE INDEX IX_invoices_practitioner 
    ON invoices(practitioner_id, is_deleted, invoice_date)
    INCLUDE (status, amount_cents, medicare_rebate_cents);

-- Index for payment tracking
CREATE INDEX IX_invoices_status 
    ON invoices(status, is_deleted)
    INCLUDE (due_date, amount_cents);

-- Index for Proda integration
CREATE INDEX IX_invoices_proda 
    ON invoices(proda_claim_id)
    WHERE proda_claim_id IS NOT NULL;

PRINT 'V038: Invoices table created successfully';
