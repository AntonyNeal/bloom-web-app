-- Migration: 008_billing_and_payouts
-- Description: Invoicing, Medicare claims, and practitioner payouts
-- Created: 2026-01-29

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_number NVARCHAR(50) UNIQUE NOT NULL,  -- e.g., "INV-2026-00001"
    
    -- Links
    appointment_id UNIQUEIDENTIFIER NOT NULL REFERENCES appointments(id),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES clients(id),
    
    -- Billing type
    billing_type NVARCHAR(20) NOT NULL,           -- 'PUBLIC', 'PRIVATE', 'NDIS'
    
    -- Amounts
    total_amount DECIMAL(10,2) NOT NULL,          -- Full session fee
    medicare_rebate DECIMAL(10,2) DEFAULT 0,      -- Medicare rebate amount
    gap_amount DECIMAL(10,2) DEFAULT 0,           -- Client pays this
    
    -- Practitioner split (80/20)
    practitioner_amount DECIMAL(10,2) NOT NULL,   -- 80% of total
    practice_amount DECIMAL(10,2) NOT NULL,       -- 20% of total
    
    -- Status
    status NVARCHAR(50) DEFAULT 'pending',        -- 'pending', 'sent', 'paid', 'partially_paid', 'cancelled', 'refunded'
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT GETDATE(),
    due_date DATE,
    paid_at DATETIME2,
    
    -- Payment tracking
    amount_paid DECIMAL(10,2) DEFAULT 0,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_invoices_practitioner ON invoices(practitioner_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- ============================================
-- INVOICE LINE ITEMS
-- ============================================
CREATE TABLE invoice_line_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    description NVARCHAR(255) NOT NULL,           -- e.g., "Psychology Consultation (50+ min)"
    medicare_item_code NVARCHAR(20),              -- e.g., "80110", "91167"
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_line_items(invoice_id);

-- ============================================
-- PAYMENTS (from clients via Stripe)
-- ============================================
CREATE TABLE payments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL REFERENCES invoices(id),
    
    amount DECIMAL(10,2) NOT NULL,
    payment_method NVARCHAR(50) NOT NULL,         -- 'stripe', 'bank_transfer', 'cash', 'medicare'
    
    -- Stripe details
    stripe_payment_intent_id NVARCHAR(100),
    stripe_charge_id NVARCHAR(100),
    
    status NVARCHAR(50) DEFAULT 'completed',      -- 'pending', 'completed', 'failed', 'refunded'
    
    paid_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

-- ============================================
-- MEDICARE CLAIMS
-- ============================================
CREATE TABLE medicare_claims (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL REFERENCES invoices(id),
    
    -- Claim details
    claim_reference NVARCHAR(100),                -- Medicare claim reference
    item_code NVARCHAR(20) NOT NULL,              -- e.g., "80110"
    service_date DATE NOT NULL,
    
    -- Provider details (from practitioner accreditations)
    provider_number NVARCHAR(20) NOT NULL,        -- Medicare provider number
    
    -- Patient details
    patient_medicare_number NVARCHAR(20),
    patient_irn NVARCHAR(5),                      -- Individual Reference Number
    
    -- Amounts
    charge_amount DECIMAL(10,2) NOT NULL,
    benefit_amount DECIMAL(10,2),                 -- Rebate amount returned
    
    -- Status
    status NVARCHAR(50) DEFAULT 'pending',        -- 'pending', 'submitted', 'approved', 'rejected', 'paid'
    submitted_at DATETIME2,
    processed_at DATETIME2,
    
    -- Rejection handling
    rejection_code NVARCHAR(20),
    rejection_reason NVARCHAR(500),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_medicare_claims_invoice ON medicare_claims(invoice_id);
CREATE INDEX idx_medicare_claims_status ON medicare_claims(status);
CREATE INDEX idx_medicare_claims_reference ON medicare_claims(claim_reference);

-- ============================================
-- PRACTITIONER PAYOUTS (80% to contractors)
-- ============================================
CREATE TABLE practitioner_payouts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id),
    
    -- Payout period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Amounts
    gross_billings DECIMAL(10,2) NOT NULL,        -- Total invoiced during period
    practitioner_share DECIMAL(10,2) NOT NULL,    -- 80% of gross
    practice_share DECIMAL(10,2) NOT NULL,        -- 20% of gross
    
    -- Deductions (if any)
    deductions DECIMAL(10,2) DEFAULT 0,
    deduction_notes NVARCHAR(500),
    
    net_payout DECIMAL(10,2) NOT NULL,            -- practitioner_share - deductions
    
    -- Status
    status NVARCHAR(50) DEFAULT 'pending',        -- 'pending', 'approved', 'paid', 'cancelled'
    approved_at DATETIME2,
    approved_by NVARCHAR(100),
    
    -- Payment details
    paid_at DATETIME2,
    payment_reference NVARCHAR(100),              -- Bank transfer reference
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_payouts_practitioner ON practitioner_payouts(practitioner_id);
CREATE INDEX idx_payouts_status ON practitioner_payouts(status);
CREATE INDEX idx_payouts_period ON practitioner_payouts(period_start, period_end);

-- ============================================
-- PAYOUT LINE ITEMS (links payout to invoices)
-- ============================================
CREATE TABLE payout_line_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payout_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioner_payouts(id) ON DELETE CASCADE,
    invoice_id UNIQUEIDENTIFIER NOT NULL REFERENCES invoices(id),
    
    invoice_amount DECIMAL(10,2) NOT NULL,        -- Total invoice
    practitioner_amount DECIMAL(10,2) NOT NULL,   -- 80% share
    
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_payout_items_payout ON payout_line_items(payout_id);
CREATE INDEX idx_payout_items_invoice ON payout_line_items(invoice_id);

-- ============================================
-- PRACTITIONER BANK DETAILS (for payouts)
-- ============================================
CREATE TABLE practitioner_bank_details (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    
    account_name NVARCHAR(255) NOT NULL,
    bsb NVARCHAR(10) NOT NULL,
    account_number NVARCHAR(20) NOT NULL,
    
    -- For contractors
    abn NVARCHAR(20),
    
    is_verified BIT DEFAULT 0,
    verified_at DATETIME2,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT uq_practitioner_bank UNIQUE (practitioner_id)
);

-- ============================================
-- CLIENT MEDICARE DETAILS
-- ============================================
ALTER TABLE clients ADD
    medicare_number NVARCHAR(20),
    medicare_irn NVARCHAR(5),                     -- Individual Reference Number (1-9)
    medicare_expiry DATE,
    has_mental_health_plan BIT DEFAULT 0,
    mental_health_plan_expiry DATE,
    mental_health_plan_sessions_used INT DEFAULT 0,
    mental_health_plan_sessions_total INT DEFAULT 10,  -- Usually 10 per calendar year
    referring_gp_name NVARCHAR(255),
    referring_gp_provider_number NVARCHAR(20),
    ndis_number NVARCHAR(20),
    ndis_plan_manager NVARCHAR(255);

-- ============================================
-- BILLING CONFIG
-- ============================================
CREATE TABLE billing_config (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Split percentages
    practitioner_share_percent DECIMAL(5,2) DEFAULT 80.00,
    practice_share_percent DECIMAL(5,2) DEFAULT 20.00,
    
    -- Fee tiers
    fee_tier_1 DECIMAL(10,2) DEFAULT 250.00,
    fee_tier_2 DECIMAL(10,2) DEFAULT 280.00,
    fee_tier_3 DECIMAL(10,2) DEFAULT 310.00,
    fee_tier_4 DECIMAL(10,2) DEFAULT 340.00,
    
    -- NDIS rates (fixed by NDIS)
    ndis_rate_clinical_psych DECIMAL(10,2) DEFAULT 214.41,
    ndis_rate_registered_psych DECIMAL(10,2) DEFAULT 193.99,
    
    -- Medicare item codes
    -- Clinical Psychologist
    medicare_clinical_initial_short NVARCHAR(10) DEFAULT '80010',
    medicare_clinical_initial_long NVARCHAR(10) DEFAULT '80110',
    medicare_clinical_subsequent_short NVARCHAR(10) DEFAULT '80000',
    medicare_clinical_subsequent_long NVARCHAR(10) DEFAULT '80100',
    medicare_clinical_telehealth_short NVARCHAR(10) DEFAULT '91168',
    medicare_clinical_telehealth_long NVARCHAR(10) DEFAULT '91167',
    
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Insert default config
INSERT INTO billing_config (id) VALUES (NEWID());

-- ============================================
-- MIGRATION RECORD
-- ============================================
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('008', 'billing_and_payouts', GETDATE());
