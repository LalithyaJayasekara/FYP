# CareLink Eraser.io Diagram Prompts

This file contains copy-paste prompts for generating detailed diagrams in Eraser AI for the CareLink project.

## Prompt 1: Detailed Use Case Diagram

Create a detailed UML Use Case Diagram for a system named CareLink: AI-Enabled Healthcare-HR Bridge for Learning Disorder Screening and Support.

System scope:
The platform coordinates dyslexia and dyscalculia screening, clinician validation, HR accommodation planning, consent-controlled data sharing, and outcomes tracking.

Primary actors:
1. Employee
2. HR Manager
3. Clinician (Psychologist or Specialist)
4. System Administrator
5. External EHR System
6. External HRIS System
7. AI Screening Engine
8. Notification Service

Core use cases for Employee:
1. Register and authenticate
2. Provide consent preferences
3. Complete questionnaire-based screening
4. Upload optional voice and writing artifacts (future phase)
5. View screening status and recommendations
6. Request support/accommodation review
7. Revoke or modify consent

Core use cases for Clinician:
1. Review screening results and confidence
2. Validate or reject AI risk output
3. Record clinical labels for dyslexia/dyscalculia
4. Enter severity assessment (mild/moderate/severe in later phase)
5. Add intervention recommendations
6. Monitor progress and reassessment outcomes

Core use cases for HR Manager:
1. Review approved accommodation-relevant outputs
2. Create personalized workplace accommodation plan by role
3. Track implementation status
4. Record workplace performance outcomes
5. Coordinate with clinician on plan adjustments

Core use cases for System Administrator:
1. Manage users and roles
2. Configure questionnaire versions and language packs
3. Configure thresholds and policy rules
4. Monitor audit logs and privacy compliance
5. Manage integrations and API keys

Integration use cases:
1. Sync clinical context from EHR
2. Sync employee role and performance metadata from HRIS
3. Send alerts and reminders via notification service

Important relationships:
1. Complete questionnaire includes consent validation
2. AI risk scoring includes feature extraction and guardrail checks
3. Clinician validation extends AI risk scoring
4. HR accommodation planning includes clinician-approved recommendations
5. All sensitive actions include audit logging
6. Data sharing includes consent scope check

Model non-functional constraints as notes:
1. Human-in-the-loop clinical governance
2. Privacy-by-design and least privilege
3. API-first interoperability
4. No autonomous diagnosis claim

Layout request:
1. Place actors outside system boundary
2. Group use cases by Employee, Clinical, HR, Admin, Integration lanes
3. Show include and extend relations clearly
4. Keep diagram readable and professional for final year project report

## Prompt 2: Detailed DFD (Context + Level 1)

Create a complete Data Flow Diagram set for CareLink with:
1. Context Diagram (Level 0)
2. Level 1 DFD with detailed processes and data stores

Context Diagram requirements:
Single process:
CareLink Screening and Coordination Platform

External entities:
1. Employee
2. Clinician
3. HR Manager
4. EHR System
5. HRIS System
6. Notification Service
7. Compliance Auditor

Context data flows:
1. Employee sends consent and questionnaire responses
2. Platform returns screening status and next steps
3. Clinician receives screening evidence and submits validation labels
4. HR receives approved accommodation guidance
5. EHR provides clinical context and receives validated outputs where authorized
6. HRIS provides role/task metadata and receives approved support plan status
7. Notification service receives event triggers and sends reminders
8. Auditor retrieves logs and compliance reports

Level 1 DFD processes:
P1 Identity and Access Control
P2 Consent and Policy Management
P3 Questionnaire Management and Response Capture
P4 Feature Engineering and Data Quality Checks
P5 AI Screening (Dyslexia and Dyscalculia Risk)
P6 Clinical Guardrail and Evidence Validation
P7 Clinician Review and Labeling
P8 HR Accommodation Planning and Workflow
P9 Outcome Tracking and Feedback Loop
P10 Integration and Interoperability Services
P11 Audit, Monitoring, and Compliance Reporting

Data stores:
D1 User and Role Store
D2 Consent Store
D3 Questionnaire Repository
D4 Screening Response Store
D5 Feature Store
D6 Model Output Store
D7 Clinician Validation Store
D8 Accommodation Plan Store
D9 Outcome Metrics Store
D10 Audit Log Store
D11 Integration Mapping Store

Critical flow logic to show:
1. No scoring if clinical consent is missing
2. Questionnaire responses go to feature engineering before model scoring
3. Model outputs pass through guardrails before being shown
4. Low confidence or incomplete evidence routes to clinician review
5. HR only receives minimum necessary data under consent scope
6. Clinician labels feed threshold tuning and model improvement
7. All major actions write to audit logs

Layout request:
1. Use standard DFD symbols and directional arrows
2. Keep process numbering explicit
3. Label every data flow with business meaning
4. Use a clean hierarchical structure suitable for academic submission

## Prompt 3: Detailed Sequence Diagram (Primary + Alternate Flows)

Create a detailed UML Sequence Diagram for end-to-end questionnaire-first screening in CareLink.

Participants:
1. Employee App
2. API Gateway
3. Orchestrator Service
4. Intake and Consent Agent
5. Questionnaire Service
6. Feature Engineering Agent
7. Quality and Guardrail Agent
8. Prediction Agent (XGBoost models)
9. Clinical Rules Service
10. Clinician Portal
11. HR Portal
12. Data Stores
13. Notification Service
14. Audit Service

Primary scenario:
1. Employee logs in and starts screening
2. API Gateway requests consent status
3. Intake agent validates role and consent
4. Questionnaire service returns active form version and language
5. Employee submits questionnaire responses
6. Orchestrator triggers feature engineering
7. Guardrail agent validates completeness and quality
8. Prediction agent runs dyslexia and dyscalculia risk models
9. Clinical rules service applies DSM/ICD alignment checks and confidence logic
10. Result is classified as low risk, possible dyslexia, possible dyscalculia, or combined risk
11. Store response, features, outputs, and audit entries
12. Notify employee of result status

Alternate path A:
Consent missing
1. Intake rejects request
2. API returns consent required message
3. Audit entry logged

Alternate path B:
Low confidence or incomplete evidence
1. Guardrail flags case
2. Orchestrator routes to clinician queue
3. Clinician reviews and validates or rejects model output
4. Updated label stored
5. Employee and HR receive updated status based on consent scope

Alternate path C:
High or combined risk with approved sharing
1. Orchestrator triggers HR workflow
2. HR portal receives accommodation recommendation package
3. HR creates role-based support plan
4. Plan and progress metrics stored
5. Follow-up reminders triggered

Post-processing sequence:
1. Clinician labels and outcomes feed threshold tuning pipeline
2. Model performance metrics are updated
3. Compliance reports generated from audit logs

Diagram style request:
1. Show activation bars and return messages
2. Use alt blocks for alternate paths
3. Clearly mark synchronous vs asynchronous calls
4. Keep labels implementation-friendly for engineering handoff

## Prompt 4: Optional High-Level Architecture Flowchart

Create a detailed system architecture flowchart for CareLink with layers:
1. Presentation Layer (Employee, Clinician, HR, Admin portals)
2. API and Security Layer (Gateway, Auth, RBAC)
3. Orchestration Layer (central orchestrator and workflow engine)
4. Agent Layer (intake, feature, quality, prediction, recommendation)
5. Clinical Governance Layer (consent policy, DSM/ICD guardrails, clinician validation)
6. Data Layer (screening data, features, labels, outcomes, audit logs)
7. Integration Layer (EHR, HRIS, notification, analytics)
8. MLOps Layer (training, threshold tuning, drift monitoring, model registry)

Show key principles as side notes:
1. Human-in-the-loop
2. Minimum necessary disclosure
3. API-first interoperability
4. Questionnaire-first MVP with multimodal extension path
