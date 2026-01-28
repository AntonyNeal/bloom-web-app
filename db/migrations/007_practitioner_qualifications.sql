-- Migration: 007_practitioner_qualifications
-- Description: Rich data model for practitioner qualifications and specializations
-- Created: 2026-01-29

-- ============================================
-- EDUCATION (Degrees, Universities)
-- ============================================
CREATE TABLE practitioner_education (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    
    institution NVARCHAR(255) NOT NULL,           -- e.g., "University of Melbourne"
    degree NVARCHAR(255) NOT NULL,                -- e.g., "Master of Clinical Psychology"
    field_of_study NVARCHAR(255),                 -- e.g., "Clinical Psychology"
    graduation_year INT,
    is_highest_qualification BIT DEFAULT 0,       -- For determining tier
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_practitioner_education_practitioner ON practitioner_education(practitioner_id);

-- ============================================
-- ACCREDITATIONS (AHPRA, Medicare, etc.)
-- ============================================
CREATE TABLE practitioner_accreditations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    
    type NVARCHAR(50) NOT NULL,                   -- 'AHPRA', 'MEDICARE', 'NDIS', 'DVA', etc.
    registration_number NVARCHAR(100) NOT NULL,   -- e.g., "PSY0001234567"
    status NVARCHAR(50) DEFAULT 'active',         -- 'active', 'pending', 'expired', 'suspended'
    issued_date DATE,
    expiry_date DATE,
    verified_at DATETIME2,                        -- When we verified against register
    verified_by NVARCHAR(100),                    -- 'system' or admin user
    
    -- Medicare-specific
    medicare_provider_number NVARCHAR(20),        -- e.g., "1234567A"
    medicare_location_id NVARCHAR(50),            -- Linked to practice location
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_practitioner_accreditations_practitioner ON practitioner_accreditations(practitioner_id);
CREATE INDEX idx_practitioner_accreditations_type ON practitioner_accreditations(type);
CREATE UNIQUE INDEX idx_practitioner_ahpra ON practitioner_accreditations(registration_number) WHERE type = 'AHPRA';

-- ============================================
-- COURSES & TRAINING (CPD, Workshops, Certifications)
-- ============================================
CREATE TABLE practitioner_courses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    
    name NVARCHAR(255) NOT NULL,                  -- e.g., "EMDR Basic Training"
    provider NVARCHAR(255),                       -- e.g., "EMDR Association of Australia"
    type NVARCHAR(50),                            -- 'certification', 'workshop', 'cpd', 'supervision'
    completion_date DATE,
    expiry_date DATE,                             -- For certifications that need renewal
    cpd_hours DECIMAL(5,2),                       -- CPD points/hours earned
    certificate_url NVARCHAR(500),                -- Link to uploaded certificate
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_practitioner_courses_practitioner ON practitioner_courses(practitioner_id);

-- ============================================
-- THERAPEUTIC MODALITIES (Treatment approaches qualified in)
-- ============================================
CREATE TABLE therapeutic_modalities (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) UNIQUE NOT NULL,            -- 'CBT', 'EMDR', 'ACT', 'DBT', etc.
    name NVARCHAR(100) NOT NULL,                  -- 'Cognitive Behavioural Therapy'
    description NVARCHAR(500),
    category NVARCHAR(50),                        -- 'evidence-based', 'somatic', 'psychodynamic'
    is_active BIT DEFAULT 1
);

CREATE TABLE practitioner_modalities (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    modality_id UNIQUEIDENTIFIER NOT NULL REFERENCES therapeutic_modalities(id),
    
    proficiency_level NVARCHAR(50),               -- 'trained', 'experienced', 'specialist', 'supervisor'
    years_experience INT,
    notes NVARCHAR(500),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT uq_practitioner_modality UNIQUE (practitioner_id, modality_id)
);

CREATE INDEX idx_practitioner_modalities_practitioner ON practitioner_modalities(practitioner_id);

-- ============================================
-- CLIENT TYPES / POPULATIONS (Who they work with)
-- ============================================
CREATE TABLE client_populations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) UNIQUE NOT NULL,            -- 'adults', 'children', 'couples', etc.
    name NVARCHAR(100) NOT NULL,                  -- 'Adults (18+)'
    category NVARCHAR(50),                        -- 'age_group', 'relationship', 'identity'
    is_active BIT DEFAULT 1
);

CREATE TABLE practitioner_populations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    population_id UNIQUEIDENTIFIER NOT NULL REFERENCES client_populations(id),
    
    years_experience INT,
    notes NVARCHAR(500),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT uq_practitioner_population UNIQUE (practitioner_id, population_id)
);

CREATE INDEX idx_practitioner_populations_practitioner ON practitioner_populations(practitioner_id);

-- ============================================
-- AREAS OF FOCUS (Presenting issues they treat)
-- ============================================
CREATE TABLE areas_of_focus (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) UNIQUE NOT NULL,            -- 'anxiety', 'depression', 'trauma', etc.
    name NVARCHAR(100) NOT NULL,                  -- 'Anxiety Disorders'
    category NVARCHAR(50),                        -- 'mood', 'trauma', 'relationship', 'developmental'
    is_active BIT DEFAULT 1
);

CREATE TABLE practitioner_focus_areas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    focus_area_id UNIQUEIDENTIFIER NOT NULL REFERENCES areas_of_focus(id),
    
    is_primary BIT DEFAULT 0,                     -- Their main specialties
    years_experience INT,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT uq_practitioner_focus UNIQUE (practitioner_id, focus_area_id)
);

CREATE INDEX idx_practitioner_focus_practitioner ON practitioner_focus_areas(practitioner_id);

-- ============================================
-- SEED DATA: Common modalities
-- ============================================
INSERT INTO therapeutic_modalities (code, name, description, category) VALUES
('CBT', 'Cognitive Behavioural Therapy', 'Evidence-based therapy focusing on thoughts, feelings and behaviours', 'evidence-based'),
('ACT', 'Acceptance and Commitment Therapy', 'Mindfulness-based behavioural therapy', 'evidence-based'),
('DBT', 'Dialectical Behaviour Therapy', 'Skills-based therapy for emotion regulation', 'evidence-based'),
('EMDR', 'Eye Movement Desensitization and Reprocessing', 'Trauma-focused therapy using bilateral stimulation', 'trauma'),
('Schema', 'Schema Therapy', 'Integrative therapy addressing early maladaptive schemas', 'psychodynamic'),
('Psychodynamic', 'Psychodynamic Therapy', 'Insight-oriented therapy exploring unconscious patterns', 'psychodynamic'),
('EFT', 'Emotionally Focused Therapy', 'Attachment-based therapy for couples and individuals', 'attachment'),
('IFS', 'Internal Family Systems', 'Parts-based therapy model', 'somatic'),
('Somatic', 'Somatic Experiencing', 'Body-based trauma therapy', 'somatic'),
('MBCT', 'Mindfulness-Based Cognitive Therapy', 'Mindfulness integrated with CBT for depression', 'evidence-based'),
('MI', 'Motivational Interviewing', 'Client-centered approach for behaviour change', 'evidence-based'),
('Narrative', 'Narrative Therapy', 'Story-focused therapy approach', 'postmodern'),
('Solution', 'Solution-Focused Brief Therapy', 'Goal-oriented brief intervention', 'postmodern'),
('Play', 'Play Therapy', 'Child-focused therapeutic approach', 'child'),
('Art', 'Art Therapy', 'Creative arts-based therapy', 'expressive');

-- ============================================
-- SEED DATA: Client populations
-- ============================================
INSERT INTO client_populations (code, name, category) VALUES
('adults', 'Adults (18-65)', 'age_group'),
('older_adults', 'Older Adults (65+)', 'age_group'),
('young_adults', 'Young Adults (18-25)', 'age_group'),
('adolescents', 'Adolescents (12-17)', 'age_group'),
('children', 'Children (5-12)', 'age_group'),
('couples', 'Couples', 'relationship'),
('families', 'Families', 'relationship'),
('lgbtqia', 'LGBTQIA+', 'identity'),
('first_nations', 'First Nations Peoples', 'identity'),
('cald', 'Culturally Diverse Backgrounds', 'identity'),
('veterans', 'Veterans & First Responders', 'occupation'),
('healthcare', 'Healthcare Workers', 'occupation'),
('perinatal', 'Perinatal & New Parents', 'life_stage'),
('ndis', 'NDIS Participants', 'funding');

-- ============================================
-- SEED DATA: Areas of focus
-- ============================================
INSERT INTO areas_of_focus (code, name, category) VALUES
('anxiety', 'Anxiety Disorders', 'mood'),
('depression', 'Depression', 'mood'),
('trauma', 'Trauma & PTSD', 'trauma'),
('complex_trauma', 'Complex Trauma', 'trauma'),
('grief', 'Grief & Loss', 'life'),
('stress', 'Stress Management', 'mood'),
('ocd', 'OCD & Related Disorders', 'mood'),
('eating', 'Eating Disorders', 'behavioural'),
('addiction', 'Addiction & Substance Use', 'behavioural'),
('relationship', 'Relationship Issues', 'relationship'),
('anger', 'Anger Management', 'behavioural'),
('self_esteem', 'Self-Esteem & Identity', 'developmental'),
('life_transitions', 'Life Transitions', 'life'),
('workplace', 'Workplace & Career Issues', 'life'),
('chronic_illness', 'Chronic Illness & Pain', 'health'),
('sleep', 'Sleep Disorders', 'health'),
('adhd', 'ADHD', 'developmental'),
('autism', 'Autism Spectrum', 'developmental'),
('personality', 'Personality Disorders', 'personality'),
('bipolar', 'Bipolar Disorder', 'mood'),
('psychosis', 'Psychosis & Schizophrenia', 'severe'),
('domestic_violence', 'Domestic & Family Violence', 'trauma'),
('sexual_abuse', 'Sexual Abuse & Assault', 'trauma'),
('phobias', 'Phobias', 'mood'),
('social_anxiety', 'Social Anxiety', 'mood');

-- ============================================
-- ADD PRACTITIONER TIER & FEE FIELDS
-- ============================================
ALTER TABLE practitioners ADD 
    qualification_tier INT,                       -- 1, 2, or 3 (Bloom flower tier)
    session_fee_tier NVARCHAR(10),               -- '250', '280', '310', '340'
    fee_effective_date DATE,                     -- When current fee took effect
    fee_locked_until DATE,                       -- Can't change until this date (Jan 1 next year)
    years_experience INT,
    supervisor_id UNIQUEIDENTIFIER REFERENCES practitioners(id),  -- For supervised practitioners
    can_supervise BIT DEFAULT 0;

-- ============================================
-- MIGRATION RECORD
-- ============================================
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('007', 'practitioner_qualifications', GETDATE());
