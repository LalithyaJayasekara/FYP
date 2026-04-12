-- CareLink Screening Schema (Oracle 23C)
-- Scope: questionnaire-first dyslexia/dyscalculia screening workflow with guest pre-auth flow,
-- consent governance, AI scoring traceability, clinician review, and auditability.
-- Oracle 23C adaptations: TIMESTAMP WITH TIME ZONE, JSON, SYS_GUID(), IDENTITY columns

BEGIN TRANSACTION;

-- Enable JSON functionality (native in Oracle 23C)
-- JSON columns are supported natively

-- Sequence for potential fallback (if needed, though IDENTITY is preferred in 23C)
CREATE SEQUENCE seq_generic START WITH 1 INCREMENT BY 1;

-- -----------------------------------------------------------------------------
-- 1) Identity / Actor Layer
-- -----------------------------------------------------------------------------

CREATE TABLE person (
    person_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    external_auth_id VARCHAR2(255) UNIQUE,
    role VARCHAR2(50) NOT NULL CHECK (role IN ('employee', 'clinician', 'hr_manager', 'admin')),
    email VARCHAR2(255) UNIQUE,
    display_name VARCHAR2(255),
    status VARCHAR2(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE TABLE guest_session (
    guest_session_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    chat_turns_used NUMBER(2,0) NOT NULL DEFAULT 0 CHECK (chat_turns_used >= 0 AND chat_turns_used <= 3),
    intended_path VARCHAR2(255) NOT NULL DEFAULT '/screening',
    status VARCHAR2(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'consumed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_guest_session_expires_at ON guest_session (expires_at);

-- -----------------------------------------------------------------------------
-- 2) Consent and Governance
-- -----------------------------------------------------------------------------

CREATE TABLE consent_record (
    consent_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,

    -- subject can be either authenticated person OR guest session
    person_id RAW(16) REFERENCES person(person_id) ON DELETE CASCADE,
    guest_session_id RAW(16) REFERENCES guest_session(guest_session_id) ON DELETE CASCADE,

    consent_type VARCHAR2(50) NOT NULL CHECK (
        consent_type IN ('clinical_assessment', 'hr_sharing', 'research_use')
    ),
    granted NUMBER(1,0) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    policy_version VARCHAR2(50) NOT NULL,
    notes CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,

    CONSTRAINT chk_consent_subject CHECK (
        (person_id IS NOT NULL AND guest_session_id IS NULL)
        OR
        (person_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

CREATE INDEX idx_consent_person_id ON consent_record (person_id);
CREATE INDEX idx_consent_guest_session_id ON consent_record (guest_session_id);
CREATE INDEX idx_consent_type_granted ON consent_record (consent_type, granted);

-- -----------------------------------------------------------------------------
-- 3) Assessment Definitions (FHIR Questionnaire metadata)
-- -----------------------------------------------------------------------------

CREATE TABLE assessment_definition (
    assessment_definition_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    questionnaire_fhir_id VARCHAR2(255) NOT NULL,
    version VARCHAR2(50) NOT NULL,
    language_code VARCHAR2(10) NOT NULL,
    title VARCHAR2(500) NOT NULL,
    status VARCHAR2(50) NOT NULL CHECK (status IN ('draft', 'active', 'retired')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_by_person_id RAW(16) REFERENCES person(person_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (questionnaire_fhir_id, version, language_code)
);

CREATE TABLE assessment_item_definition (
    item_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    assessment_definition_id RAW(16) NOT NULL REFERENCES assessment_definition(assessment_definition_id) ON DELETE CASCADE,
    link_id VARCHAR2(100) NOT NULL,
    item_text VARCHAR2(1000) NOT NULL,
    construct_code VARCHAR2(100),
    disorder_domain VARCHAR2(50) CHECK (disorder_domain IN ('dyslexia', 'dyscalculia', 'functional-impact', 'general')),
    required NUMBER(1,0) NOT NULL DEFAULT 1,
    scale_min NUMBER(2,0) NOT NULL DEFAULT 0,
    scale_max NUMBER(2,0) NOT NULL DEFAULT 4,
    display_order NUMBER(4,0) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (assessment_definition_id, link_id),
    UNIQUE (assessment_definition_id, display_order),
    CONSTRAINT chk_assessment_item_scale CHECK (scale_min <= scale_max)
);

CREATE INDEX idx_item_assessment_definition_id ON assessment_item_definition (assessment_definition_id);

-- -----------------------------------------------------------------------------
-- 4) Submission / Response
-- -----------------------------------------------------------------------------

CREATE TABLE assessment_submission (
    submission_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,

    -- one subject model: person or guest
    person_id RAW(16) REFERENCES person(person_id) ON DELETE SET NULL,
    guest_session_id RAW(16) REFERENCES guest_session(guest_session_id) ON DELETE SET NULL,

    assessment_definition_id RAW(16) NOT NULL REFERENCES assessment_definition(assessment_definition_id) ON DELETE RESTRICT,
    entry_mode VARCHAR2(50) NOT NULL CHECK (entry_mode IN ('guest', 'authenticated')),
    language_code VARCHAR2(10) NOT NULL,
    completion_status VARCHAR2(50) NOT NULL CHECK (completion_status IN ('in_progress', 'submitted', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    resumed_from_guest NUMBER(1,0) NOT NULL DEFAULT 0,
    metadata_json JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,

    CONSTRAINT chk_submission_subject CHECK (
        (person_id IS NOT NULL AND guest_session_id IS NULL)
        OR
        (person_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

CREATE INDEX idx_submission_person_id ON assessment_submission (person_id);
CREATE INDEX idx_submission_guest_session_id ON assessment_submission (guest_session_id);
CREATE INDEX idx_submission_assessment_definition_id ON assessment_submission (assessment_definition_id);
CREATE INDEX idx_submission_status ON assessment_submission (completion_status);

CREATE TABLE questionnaire_response (
    response_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    questionnaire_fhir_reference VARCHAR2(500) NOT NULL,
    authored_at TIMESTAMP WITH TIME ZONE NOT NULL,
    validation_status VARCHAR2(50) NOT NULL CHECK (validation_status IN ('valid', 'invalid', 'needs_review')),
    fhir_payload_json JSON NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_questionnaire_response_submission_id ON questionnaire_response (submission_id);

CREATE TABLE response_answer (
    answer_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    response_id RAW(16) NOT NULL REFERENCES questionnaire_response(response_id) ON DELETE CASCADE,
    item_id RAW(16) NOT NULL REFERENCES assessment_item_definition(item_id) ON DELETE RESTRICT,
    value_integer NUMBER(2,0) NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (response_id, item_id)
);

CREATE INDEX idx_response_answer_response_id ON response_answer (response_id);
CREATE INDEX idx_response_answer_item_id ON response_answer (item_id);

-- -----------------------------------------------------------------------------
-- 5) Feature Engineering / Guardrails
-- -----------------------------------------------------------------------------

CREATE TABLE feature_vector (
    feature_vector_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    extraction_version VARCHAR2(50) NOT NULL,
    feature_json JSON NOT NULL,
    quality_score NUMBER(5,4),
    consistency_score NUMBER(5,4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE TABLE guardrail_evaluation (
    guardrail_eval_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    developmental_history_captured NUMBER(1,0),
    persistence_signals_present NUMBER(1,0),
    exclusion_checks_complete NUMBER(1,0),
    contradictory_evidence NUMBER(1,0) NOT NULL DEFAULT 0,
    confidence_adjustment NUMBER(6,4) NOT NULL DEFAULT 0,
    is_inconclusive NUMBER(1,0) NOT NULL DEFAULT 0,
    rationale_json JSON,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6) Model / Threshold Registry
-- -----------------------------------------------------------------------------

CREATE TABLE model_version (
    model_version_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    model_name VARCHAR2(100) NOT NULL CHECK (model_name IN ('dyslexia_risk', 'dyscalculia_risk', 'combined_risk')),
    version VARCHAR2(50) NOT NULL,
    algorithm VARCHAR2(50) NOT NULL DEFAULT 'xgboost',
    training_data_ref VARCHAR2(500),
    metrics_json JSON,
    deployed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR2(50) NOT NULL CHECK (status IN ('candidate', 'active', 'retired')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (model_name, version)
);

CREATE TABLE threshold_version (
    threshold_version_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    model_version_id RAW(16) NOT NULL REFERENCES model_version(model_version_id) ON DELETE RESTRICT,
    threshold_name VARCHAR2(100) NOT NULL,
    dyslexia_threshold NUMBER(6,4),
    dyscalculia_threshold NUMBER(6,4),
    confidence_floor NUMBER(6,4),
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (model_version_id, threshold_name, effective_from)
);

CREATE INDEX idx_threshold_model_version_id ON threshold_version (model_version_id);

-- -----------------------------------------------------------------------------
-- 7) Predictions / Outcomes / Clinical Review
-- -----------------------------------------------------------------------------

CREATE TABLE screening_prediction (
    prediction_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    model_version_id RAW(16) NOT NULL REFERENCES model_version(model_version_id) ON DELETE RESTRICT,
    threshold_version_id RAW(16) REFERENCES threshold_version(threshold_version_id) ON DELETE SET NULL,

    dyslexia_probability NUMBER(6,4),
    dyscalculia_probability NUMBER(6,4),
    model_confidence NUMBER(6,4),

    dyslexia_screen_positive NUMBER(1,0),
    dyscalculia_screen_positive NUMBER(1,0),
    prediction_json JSON,
    predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_prediction_submission_id ON screening_prediction (submission_id);
CREATE INDEX idx_prediction_model_version_id ON screening_prediction (model_version_id);

CREATE TABLE screening_outcome (
    outcome_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    prediction_id RAW(16) UNIQUE REFERENCES screening_prediction(prediction_id) ON DELETE SET NULL,
    guardrail_eval_id RAW(16) UNIQUE REFERENCES guardrail_evaluation(guardrail_eval_id) ON DELETE SET NULL,

    outcome_class VARCHAR2(100) NOT NULL CHECK (
        outcome_class IN (
            'low_risk',
            'possible_dyslexia_risk',
            'possible_dyscalculia_risk',
            'possible_combined_risk',
            'inconclusive'
        )
    ),
    confidence_final NUMBER(6,4),
    standards_alignment_flags_json JSON,
    recommendation_text CLOB,
    requires_clinician_review NUMBER(1,0) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_outcome_outcome_class ON screening_outcome (outcome_class);

CREATE TABLE clinician_review (
    review_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    clinician_person_id RAW(16) NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    decision VARCHAR2(50) NOT NULL CHECK (decision IN ('confirmed', 'rejected', 'inconclusive')),
    clinician_label VARCHAR2(500),
    notes CLOB,
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_clinician_review_submission_id ON clinician_review (submission_id);
CREATE INDEX idx_clinician_review_clinician_person_id ON clinician_review (clinician_person_id);

CREATE TABLE calibration_label (
    calibration_label_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    submission_id RAW(16) NOT NULL REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    source_review_id RAW(16) REFERENCES clinician_review(review_id) ON DELETE SET NULL,
    dyslexia_label NUMBER(1,0),
    dyscalculia_label NUMBER(1,0),
    confidence_label NUMBER(6,4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (submission_id)
);

-- -----------------------------------------------------------------------------
-- 8) Guest Chat Guidance
-- -----------------------------------------------------------------------------

CREATE TABLE chat_interaction (
    chat_interaction_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    guest_session_id RAW(16) NOT NULL REFERENCES guest_session(guest_session_id) ON DELETE CASCADE,
    turn_no NUMBER(2,0) NOT NULL CHECK (turn_no >= 1 AND turn_no <= 3),
    user_message CLOB NOT NULL,
    assistant_message CLOB NOT NULL,
    is_limit_reached NUMBER(1,0) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
    UNIQUE (guest_session_id, turn_no)
);

CREATE INDEX idx_chat_interaction_guest_session_id ON chat_interaction (guest_session_id);

-- -----------------------------------------------------------------------------
-- 9) Audit Trail (append-only intent; enforce in app/service policy)
-- -----------------------------------------------------------------------------

CREATE TABLE audit_event (
    audit_event_id RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
    actor_person_id RAW(16) REFERENCES person(person_id) ON DELETE SET NULL,
    action VARCHAR2(100) NOT NULL,

    -- polymorphic resource reference
    resource_type VARCHAR2(100) NOT NULL,
    resource_id RAW(16),

    subject_type VARCHAR2(100),
    subject_person_id RAW(16) REFERENCES person(person_id) ON DELETE SET NULL,
    subject_guest_session_id RAW(16) REFERENCES guest_session(guest_session_id) ON DELETE SET NULL,

    ip_hash VARCHAR2(255),
    metadata_json JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,

    CONSTRAINT chk_audit_subject CHECK (
        (subject_person_id IS NOT NULL AND subject_guest_session_id IS NULL)
        OR
        (subject_person_id IS NULL AND subject_guest_session_id IS NOT NULL)
        OR
        (subject_person_id IS NULL AND subject_guest_session_id IS NULL)
    )
);

CREATE INDEX idx_audit_event_actor_person_id ON audit_event (actor_person_id);
CREATE INDEX idx_audit_event_resource ON audit_event (resource_type, resource_id);
CREATE INDEX idx_audit_event_created_at ON audit_event (created_at);

COMMIT TRANSACTION;
