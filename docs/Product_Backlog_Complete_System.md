# Product Backlog - Complete System
## Simple and Easy Version

Version: 2.0  
Date: March 22, 2026  
Product Owner Baseline: FYP Team

## 1) Purpose of This Backlog
This backlog lists the work needed to build the full Healthcare-HR Bridge platform.

It is written in simple words so each item is easy to understand, plan, and track.

Priority labels:
- Must: Needed for pilot and core system use.
- Should: Important, but can come after core features.
- Could: Useful improvements for later.

---

## 2) Main Product Goals
- Reduce time from assessment to support from 8 weeks to 3 weeks.
- Reduce time to implement workplace accommodations from 4 weeks to 1 week.
- Reach treatment compliance of at least 85%.
- Reach role-fit success of at least 85%.
- Reach retention of supported employees of at least 88%.
- Reach coordinated decision alignment of at least 88%.

---

## 3) Epics (Big Work Areas)
- E1: User Login and Sign-up
- E2: Consent, Access, and Permissions
- E3: Unified Profile and Case Records
- E4: Screening and Clinician Validation
- E5: HR Planning and Workplace Accommodations
- E6: Workflow Coordination Across Services
- E7: Analytics, KPIs, and Model Monitoring
- E8: Notifications and Task Management
- E9: API Contracts and External Integrations
- E10: Web Frontend by User Role
- E11: Security, Privacy, and Audit
- E12: DevOps, Monitoring, and Reliability

---

## 4) Product Backlog (Epic, Feature, User Stories)

| ID | Epic | Feature | User Stories | Priority | Owner | Best (min) | Optimal (min) | Worst (min) |
|---|---|---|---|---|---|---:|---:|---:|
| PBI-001 | E1 | Account registration | 1) As a new user, I can create an account.<br>2) As a new user, I can choose my role during sign-up. | Must | apps/web-frontend + identity-consent-service | 480 | 720 | 1080 |
| PBI-002 | E1 | Secure sign-in | 1) As a user, I can log in with valid credentials.<br>2) As a user, I get clear error messages for failed login. | Must | apps/web-frontend + identity-consent-service | 480 | 720 | 1080 |
| PBI-003 | E1 | Session control | 1) As a user, I stay logged in safely while active.<br>2) As a user, I can log out from any page. | Must | apps/web-frontend | 360 | 540 | 840 |
| PBI-004 | E2 | Consent preferences | 1) As a data subject, I can select what data can be shared.<br>2) As a data subject, I can set how long sharing is allowed. | Must | apps/identity-consent-service | 600 | 900 | 1320 |
| PBI-005 | E2 | Access permission checks | 1) As an admin, I can enforce role-based access.<br>2) As an admin, I can enforce purpose-based access checks. | Must | apps/identity-consent-service | 720 | 1080 | 1560 |
| PBI-006 | E2 | Consent cancellation | 1) As a privacy officer, I can revoke consent immediately.<br>2) As a privacy officer, I can block new access after revocation. | Must | apps/identity-consent-service + apps/integration-service | 720 | 1080 | 1680 |
| PBI-007 | E3 | Combined profile page | 1) As a clinician, I can view clinical and work context together.<br>2) As an HR manager, I can view the same profile with allowed fields. | Must | apps/profile-case-service | 720 | 1080 | 1560 |
| PBI-008 | E3 | Case status tracking | 1) As a coordinator, I can create a case record.<br>2) As a coordinator, I can move a case from intake to closure. | Must | apps/profile-case-service | 900 | 1320 | 1920 |
| PBI-009 | E3 | Case event timeline | 1) As a user, I can view key events in time order.<br>2) As a user, I can filter timeline events by type. | Should | apps/profile-case-service + apps/web-frontend | 720 | 1080 | 1680 |
| PBI-010 | E4 | Screening form submission | 1) As an employee, I can submit screening answers.<br>2) As an employee, I can receive risk and severity results. | Must | apps/ai-screening-service | 720 | 1080 | 1560 |
| PBI-011 | E4 | Clinician confirmation labels | 1) As a clinician, I can submit confirmed labels.<br>2) As a clinician, I can override AI results with a reason. | Must | apps/ai-screening-service | 600 | 900 | 1320 |
| PBI-012 | E4 | Pilot data export | 1) As governance staff, I can export screening data.<br>2) As governance staff, I can export clinician label data in one file. | Must | apps/ai-screening-service | 480 | 720 | 1080 |
| PBI-013 | E4 | Threshold adjustment | 1) As calibration staff, I can change model thresholds.<br>2) As calibration staff, I can enforce minimum specificity rules. | Should | apps/ai-screening-service | 600 | 900 | 1440 |
| PBI-014 | E5 | Accommodation planning | 1) As an HR manager, I can create an accommodation plan.<br>2) As an HR manager, I can link plan items to clinical needs. | Must | apps/profile-case-service | 720 | 1080 | 1560 |
| PBI-015 | E5 | Role requirement mapping | 1) As HR, I can map job demands to cognitive requirements.<br>2) As HR, I can use this map for role-fit checks. | Must | apps/profile-case-service | 720 | 1080 | 1560 |
| PBI-016 | E5 | Accommodation adherence view | 1) As a manager, I can track accommodation usage.<br>2) As a manager, I can review effectiveness over time. | Should | apps/profile-case-service | 600 | 900 | 1440 |
| PBI-017 | E6 | Cross-service workflow engine | 1) As the platform, I can run workflow steps across services.<br>2) As the platform, I can track each step status. | Must | apps/integration-service | 900 | 1320 | 1980 |
| PBI-018 | E6 | Unified recommendation request | 1) As a coordinator, I can request recommendations from clinical inputs.<br>2) As a coordinator, I can include HR inputs in the same request. | Must | apps/integration-service | 840 | 1260 | 1860 |
| PBI-019 | E6 | Recommendation conflict alerts | 1) As a coordinator, I can detect conflicts between recommendations.<br>2) As a coordinator, I can see conflict details clearly. | Must | apps/integration-service | 720 | 1080 | 1620 |
| PBI-020 | E6 | Intervention what-if comparison | 1) As a board member, I can compare intervention options.<br>2) As a board member, I can view trade-offs side by side. | Should | apps/integration-service | 900 | 1380 | 2100 |
| PBI-021 | E7 | KPI dashboard metrics | 1) As an analyst, I can view alignment and latency KPIs.<br>2) As an analyst, I can view outcome KPIs for reports. | Must | apps/ai-analytics-service | 720 | 1080 | 1620 |
| PBI-022 | E7 | Drift and fairness monitoring | 1) As governance staff, I can monitor model drift.<br>2) As governance staff, I can monitor fairness alerts. | Should | apps/ai-analytics-service | 720 | 1080 | 1740 |
| PBI-023 | E7 | Recommendation reason records | 1) As governance staff, I can see why a recommendation was made.<br>2) As governance staff, I can review explanation records later. | Should | apps/ai-analytics-service | 600 | 900 | 1440 |
| PBI-024 | E7 | Cohort insight analysis | 1) As an analytics lead, I can analyze by condition and severity.<br>2) As an analytics lead, I can analyze by role group. | Could | apps/ai-analytics-service | 720 | 1140 | 1860 |
| PBI-025 | E8 | Role-based notifications | 1) As a clinician, I receive important event alerts.<br>2) As an HR manager, I receive important event alerts for my role. | Should | apps/notification-service | 480 | 720 | 1140 |
| PBI-026 | E8 | Pending task inbox | 1) As a user, I can view pending review tasks.<br>2) As a user, I can view pending approval and follow-up tasks. | Should | apps/notification-service + apps/web-frontend | 600 | 900 | 1380 |
| PBI-027 | E8 | Critical case escalation rules | 1) As governance staff, I can define escalation rules.<br>2) As governance staff, I can apply rules to unresolved critical cases. | Could | apps/notification-service | 600 | 960 | 1500 |
| PBI-028 | E9 | Stable API contract versions | 1) As an integrator, I can use versioned API contracts.<br>2) As an integrator, I can use matching schema files. | Must | packages/api-contracts + apps/gateway-service | 600 | 900 | 1380 |
| PBI-029 | E9 | Reliable case events | 1) As operations staff, I can publish domain events.<br>2) As operations staff, I can consume domain events reliably. | Must | apps/integration-service | 720 | 1080 | 1620 |
| PBI-030 | E9 | External system connectors | 1) As the platform, I can sync with EHR systems.<br>2) As the platform, I can sync with HRIS systems. | Should | apps/integration-service | 960 | 1500 | 2340 |
| PBI-031 | E10 | Role home pages | 1) As a user, I can access my role page after login.<br>2) As a user, I see employee, clinician, HR, or calibration views. | Must | apps/web-frontend | 600 | 900 | 1320 |
| PBI-032 | E10 | Employee screening flow UI | 1) As an employee, I can complete screening step by step.<br>2) As an employee, I can review answers before submit. | Must | apps/web-frontend | 720 | 1080 | 1560 |
| PBI-033 | E10 | Clinician review workspace UI | 1) As a clinician, I can review case evidence in one page.<br>2) As a clinician, I can submit labels from the same page. | Must | apps/web-frontend | 720 | 1080 | 1560 |
| PBI-034 | E10 | HR planning dashboard UI | 1) As HR, I can manage accommodation plans.<br>2) As HR, I can manage role-fit plans from one dashboard. | Must | apps/web-frontend | 720 | 1080 | 1620 |
| PBI-035 | E10 | Leadership analytics workspace UI | 1) As leadership, I can view KPI dashboards.<br>2) As leadership, I can view calibration dashboards in one place. | Should | apps/web-frontend | 720 | 1140 | 1740 |
| PBI-036 | E11 | Access audit trail | 1) As compliance staff, I can log every data access event.<br>2) As compliance staff, I can capture user, purpose, time, and case ID. | Must | Cross-cutting | 720 | 1080 | 1680 |
| PBI-037 | E11 | Encryption and key lifecycle | 1) As security staff, I can encrypt data in transit and at rest.<br>2) As security staff, I can rotate encryption keys on schedule. | Must | infrastructure + Cross-cutting | 840 | 1260 | 1920 |
| PBI-038 | E11 | Data retention and deletion rules | 1) As a privacy officer, I can set retention rules by data type.<br>2) As a privacy officer, I can enforce deletion rules by data type. | Should | Cross-cutting | 600 | 900 | 1500 |
| PBI-039 | E12 | CI quality and security checks | 1) As DevOps, I can run tests and contract checks in CI.<br>2) As DevOps, I can run security scans in CI gates. | Must | infrastructure + all apps | 840 | 1260 | 1860 |
| PBI-040 | E12 | Reliability monitoring stack | 1) As SRE, I can monitor traces, errors, and latency.<br>2) As SRE, I can monitor backups and recovery readiness. | Must | infrastructure + all apps | 960 | 1440 | 2160 |

---

## 5) Phase Plan

### Phase 1 (Months 1-4): Foundation
Focus:
- E1, E2, E3, E4 core items
- E5 basic HR planning
- E10 core role pages
- E11 and E12 baseline controls

Must-have outcomes:
- Users can sign up, log in, and access role-based screens.
- Consent and access controls are active.
- Unified profile and case tracking work.
- Screening and clinician validation path works end-to-end.

### Phase 2 (Months 5-8): Coordination
Focus:
- E6 workflow coordination and conflict handling
- E9 event-driven integration
- E5 and E10 deeper planning screens

Must-have outcomes:
- Cross-service workflow runs reliably.
- Coordinated recommendations are available.
- Conflict alerts and resolution process are operational.

### Phase 3 (Months 9-12): Optimization
Focus:
- E7 analytics and model monitoring
- E8 notifications and task inbox
- E11/E12 hardening

Must-have outcomes:
- KPI dashboards ready for pilot reporting.
- Notifications and escalations are active.
- Security, privacy, and reliability checks are mature.

### Post-Pilot Scale (Month 13+)
Focus:
- External connectors expansion
- Advanced analytics and cohort analysis
- Organization and region-level scaling

---

## 6) Sprint 1 (Suggested)
Recommended first sprint items:
- PBI-001, PBI-002, PBI-003
- PBI-004, PBI-005
- PBI-007, PBI-008
- PBI-010

Sprint 1 goal:
- Demo a secure flow from account creation and login to consent check, profile view, and screening submission.

---

## 7) Backlog Management Rules
- Review and refine backlog weekly.
- Split large items before sprint planning.
- Keep one owner and one reviewer per PBI.
- Link each PBI to a clear acceptance test.
- Track progress by phase and priority.
