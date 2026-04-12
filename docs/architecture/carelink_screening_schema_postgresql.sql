-- CareLink Screening Schema (PostgreSQL)
-- Scope: questionnaire-first dyslexia/dyscalculia screening workflow with guest pre-auth flow,
-- consent governance, AI scoring traceability, clinician review, and auditability.

BEGIN;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1) Identity / Actor Layer
-- -----------------------------------------------------------------------------

CREATE TABLE person (
    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_auth_id TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('employee', 'clinician', 'hr_manager', 'admin')),
    email TEXT UNIQUE,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guest_session (
    guest_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    chat_turns_used INTEGER NOT NULL DEFAULT 0 CHECK (chat_turns_used >= 0 AND chat_turns_used <= 3),
    intended_path TEXT NOT NULL DEFAULT '/screening',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'consumed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_session_expires_at ON guest_session (expires_at);

-- -----------------------------------------------------------------------------
-- 2) Consent and Governance
-- -----------------------------------------------------------------------------

CREATE TABLE consent_record (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- subject can be either authenticated person OR guest session
    person_id UUID REFERENCES person(person_id) ON DELETE CASCADE,
    guest_session_id UUID REFERENCES guest_session(guest_session_id) ON DELETE CASCADE,

    consent_type TEXT NOT NULL CHECK (
        consent_type IN ('clinical_assessment', 'hr_sharing', 'research_use')
    ),
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    policy_version TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
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
    assessment_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_fhir_id TEXT NOT NULL,
    version TEXT NOT NULL,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'retired')),
    published_at TIMESTAMPTZ,
    created_by_person_id UUID REFERENCES person(person_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (questionnaire_fhir_id, version, language_code)
);

CREATE TABLE assessment_item_definition (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_definition_id UUID NOT NULL REFERENCES assessment_definition(assessment_definition_id) ON DELETE CASCADE,
    link_id TEXT NOT NULL,
    item_text TEXT NOT NULL,
    construct_code TEXT,
    disorder_domain TEXT CHECK (disorder_domain IN ('dyslexia', 'dyscalculia', 'functional-impact', 'general')),
    required BOOLEAN NOT NULL DEFAULT TRUE,
    scale_min INTEGER NOT NULL DEFAULT 0,
    scale_max INTEGER NOT NULL DEFAULT 4,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assessment_definition_id, link_id),
    UNIQUE (assessment_definition_id, display_order),
    CHECK (scale_min <= scale_max)
);

CREATE INDEX idx_item_assessment_definition_id ON assessment_item_definition (assessment_definition_id);

-- -----------------------------------------------------------------------------
-- 4) Submission / Response
-- -----------------------------------------------------------------------------

CREATE TABLE assessment_submission (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- one subject model: person or guest
    person_id UUID REFERENCES person(person_id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES guest_session(guest_session_id) ON DELETE SET NULL,

    assessment_definition_id UUID NOT NULL REFERENCES assessment_definition(assessment_definition_id) ON DELETE RESTRICT,
    entry_mode TEXT NOT NULL CHECK (entry_mode IN ('guest', 'authenticated')),
    language_code TEXT NOT NULL,
    completion_status TEXT NOT NULL CHECK (completion_status IN ('in_progress', 'submitted', 'abandoned')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    resumed_from_guest BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
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
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    questionnaire_fhir_reference TEXT NOT NULL,
    authored_at TIMESTAMPTZ NOT NULL,
    validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid', 'needs_review')),
    fhir_payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questionnaire_response_submission_id ON questionnaire_response (submission_id);

CREATE TABLE response_answer (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES questionnaire_response(response_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES assessment_item_definition(item_id) ON DELETE RESTRICT,
    value_integer INTEGER NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (response_id, item_id)
);

CREATE INDEX idx_response_answer_response_id ON response_answer (response_id);
CREATE INDEX idx_response_answer_item_id ON response_answer (item_id);

-- -----------------------------------------------------------------------------
-- 5) Feature Engineering / Guardrails
-- -----------------------------------------------------------------------------

CREATE TABLE feature_vector (
    feature_vector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    extraction_version TEXT NOT NULL,
    feature_json JSONB NOT NULL,
    quality_score NUMERIC(5,4),
    consistency_score NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guardrail_evaluation (
    guardrail_eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    developmental_history_captured BOOLEAN,
    persistence_signals_present BOOLEAN,
    exclusion_checks_complete BOOLEAN,
    contradictory_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_adjustment NUMERIC(6,4) NOT NULL DEFAULT 0,
    is_inconclusive BOOLEAN NOT NULL DEFAULT FALSE,
    rationale_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6) Model / Threshold Registry
-- -----------------------------------------------------------------------------

CREATE TABLE model_version (
    model_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL CHECK (model_name IN ('dyslexia_risk', 'dyscalculia_risk', 'combined_risk')),
    version TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'xgboost',
    training_data_ref TEXT,
    metrics_json JSONB,
    deployed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('candidate', 'active', 'retired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_name, version)
);

CREATE TABLE threshold_version (
    threshold_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID NOT NULL REFERENCES model_version(model_version_id) ON DELETE RESTRICT,
    threshold_name TEXT NOT NULL,
    dyslexia_threshold NUMERIC(6,4),
    dyscalculia_threshold NUMERIC(6,4),
    confidence_floor NUMERIC(6,4),
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_version_id, threshold_name, effective_from)
);

CREATE INDEX idx_threshold_model_version_id ON threshold_version (model_version_id);

-- -----------------------------------------------------------------------------
-- 7) Predictions / Outcomes / Clinical Review
-- -----------------------------------------------------------------------------

CREATE TABLE screening_prediction (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    model_version_id UUID NOT NULL REFERENCES model_version(model_version_id) ON DELETE RESTRICT,
    threshold_version_id UUID REFERENCES threshold_version(threshold_version_id) ON DELETE SET NULL,

    dyslexia_probability NUMERIC(6,4),
    dyscalculia_probability NUMERIC(6,4),
    model_confidence NUMERIC(6,4),

    dyslexia_screen_positive BOOLEAN,
    dyscalculia_screen_positive BOOLEAN,
    prediction_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prediction_submission_id ON screening_prediction (submission_id);
CREATE INDEX idx_prediction_model_version_id ON screening_prediction (model_version_id);

CREATE TABLE screening_outcome (
    outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    prediction_id UUID UNIQUE REFERENCES screening_prediction(prediction_id) ON DELETE SET NULL,
    guardrail_eval_id UUID UNIQUE REFERENCES guardrail_evaluation(guardrail_eval_id) ON DELETE SET NULL,

    outcome_class TEXT NOT NULL CHECK (
        outcome_class IN (
            'low_risk',
            'possible_dyslexia_risk',
            'possible_dyscalculia_risk',
            'possible_combined_risk',
            'inconclusive'
        )
    ),
    confidence_final NUMERIC(6,4),
    standards_alignment_flags_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    recommendation_text TEXT,
    requires_clinician_review BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outcome_outcome_class ON screening_outcome (outcome_class);

CREATE TABLE clinician_review (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    clinician_person_id UUID NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    decision TEXT NOT NULL CHECK (decision IN ('confirmed', 'rejected', 'inconclusive')),
    clinician_label TEXT,
    notes TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinician_review_submission_id ON clinician_review (submission_id);
CREATE INDEX idx_clinician_review_clinician_person_id ON clinician_review (clinician_person_id);

CREATE TABLE calibration_label (
    calibration_label_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assessment_submission(submission_id) ON DELETE CASCADE,
    source_review_id UUID REFERENCES clinician_review(review_id) ON DELETE SET NULL,
    dyslexia_label BOOLEAN,
    dyscalculia_label BOOLEAN,
    confidence_label NUMERIC(6,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (submission_id)
);

-- -----------------------------------------------------------------------------
-- 8) Guest Chat Guidance
-- -----------------------------------------------------------------------------

CREATE TABLE chat_interaction (
    chat_interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id UUID NOT NULL REFERENCES guest_session(guest_session_id) ON DELETE CASCADE,
    turn_no INTEGER NOT NULL CHECK (turn_no >= 1 AND turn_no <= 3),
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    is_limit_reached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (guest_session_id, turn_no)
);

CREATE INDEX idx_chat_interaction_guest_session_id ON chat_interaction (guest_session_id);

-- -----------------------------------------------------------------------------
-- 9) Audit Trail (append-only intent; enforce in app/service policy)
-- -----------------------------------------------------------------------------

CREATE TABLE audit_event (
    audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_person_id UUID REFERENCES person(person_id) ON DELETE SET NULL,
    action TEXT NOT NULL,

    -- polymorphic resource reference
    resource_type TEXT NOT NULL,
    resource_id UUID,

    subject_type TEXT,
    subject_person_id UUID REFERENCES person(person_id) ON DELETE SET NULL,
    subject_guest_session_id UUID REFERENCES guest_session(guest_session_id) ON DELETE SET NULL,

    ip_hash TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
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

COMMIT;
