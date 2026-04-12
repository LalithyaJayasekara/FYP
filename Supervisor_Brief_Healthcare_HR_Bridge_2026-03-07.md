# Supervisor Brief
## Healthcare-HR Bridge Project Status Update

**Date:** March 7, 2026  
**Prepared by:** Lalithya Jayasekata 
**Project:** AI-Enabled Healthcare-HR Bridge for Learning Disorders Screening and Support

## 1. Executive Summary
The project now has a working pilot-level flow from employee screening to clinician labeling and calibration analytics. We completed the core functional path needed for pilot operation:

1. Employee completes screening.
2. Backend calculates dyslexia/dyscalculia risk and severity.
3. Clinician submits confirmed labels.
4. System exports merged pilot outcomes.
5. Calibration dashboard tunes thresholds using confusion-matrix metrics.

The implementation aligns with `DSM-5-TR`, `ICD-11`, and `ICF` reporting context and remains positioned as a screening support tool with clinician oversight.

## 2. Scope of Adjustments Completed
### Assessment and Scoring
1. Converted employee area into a structured multi-step assessment flow.
2. Added voice and writing activities as objective evidence.
3. Integrated objective signals into both dyslexia and dyscalculia risk calculations.
4. Implemented severity output (`Low`, `Moderate`, `Severe`) and confidence flags.

### Contracts and APIs
1. Finalized shared scoring contract and JSON schema under `packages/api-contracts`.
2. Implemented scoring endpoint: `POST /api/v1/screening/score`.
3. Implemented clinician-label endpoint: `POST /api/v1/clinician-labels`.
4. Implemented pilot export endpoint: `GET /api/v1/pilot/export`.
5. Implemented threshold tuning endpoint: `GET /api/v1/pilot/tune?minSpecificity=<value>`.

### Calibration and Governance Support
1. Added calibration dashboard with confusion-matrix style statistics and threshold sweeps.
2. Added auto-tuning logic to maximize recall while enforcing minimum specificity.
3. Added clinician labeling page in frontend so labels can be entered without API commands.

### Access Control and Entry Flow
1. Added role-based access control for major routes (employee, clinician, HR manager, calibration).
2. Added authorization guard and restricted-access handling.
3. Added startup flow with splash and login/sign-up entry before dashboard access.

## 3. Architecture Snapshot (Current)
### Frontend (`apps/web-frontend`)
1. Role-based routing and protected pages.
2. Employee screening workflow with backend submission.
3. Clinician labeling workflow.
4. Calibration dashboard consuming backend export/tuning endpoints.

### Backend (`apps/ai-screening-service`)
1. Risk scoring service.
2. Clinician label ingestion.
3. Pilot outcome merge/export.
4. Threshold recommendation service.

### Data and Storage
1. Pilot records are stored in NDJSON for traceable incremental capture:
   - `data/scored-submissions.ndjson`
   - `data/clinician-labels.ndjson`
2. Export joins latest scored submission and latest clinician label per employee.

## 4. Delivery Position Against Plan
Progress remains aligned with phased delivery:

1. **Foundation (Months 1-4):** Contracts, baseline modules, and consent-aware flow established.
2. **Coordination Engine (Months 5-8):** Endpoints, cross-module submission flow, and labeling/export path delivered.
3. **Feedback & Optimization (Months 9-12 path):** Calibration dashboard and threshold governance tools delivered and ready for pilot data.

This supports the Month 8 integrated workflow checkpoint and Month 12 pilot KPI reporting target.

## 5. Current Status and Constraint
**Status:** Technically pilot-ready.  
**Current constraint:** Export currently returns zero merged outcomes until both conditions are met for the same employee:

1. At least one completed screening submission exists.
2. A clinician label exists for that employee ID.

## 6. Immediate Next Steps (Supervisor Review)
1. Run controlled pilot cohort (20-50 participants).
2. Ensure clinicians submit labels for each completed screening.
3. Use calibration dashboard to load real export and execute threshold tuning.
4. Approve threshold set and freeze scoring/configuration version for pilot period.
5. Produce Month 8 evidence package (workflow demo, baseline confusion matrix, governance summary).

## 7. Assurance Statement
The system is implemented as a **screening support platform**, not an autonomous diagnostic system. Clinical conclusions remain human-validated (human-in-the-loop), with privacy and governance controls preserved as release conditions.
