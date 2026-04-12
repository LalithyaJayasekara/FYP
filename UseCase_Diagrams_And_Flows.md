# Use Case Diagrams & Visual Flows
## Healthcare-HR Bridge System

---

## DIAGRAM 1: System Use Case Overview

```mermaid
flowchart TB
    A[AI-Enabled Healthcare-HR Bridge System]
    G[Guest Pre-Auth Experience<br/>10 FHIR Questions, 3-Chat Cap, Preliminary Results]
    GS[Guest Session Service<br/>Temporary State + 24h TTL]
    P[Unified Individual Profile<br/>Single Source of Truth + Real-time Sync]
    C[Clinical Domain Module<br/>Assessment, Diagnosis, Treatment, Monitoring]
    I[Integration Engine<br/>Cross-Domain Sync, Event Propagation, Conflict Detection]
    O[Occupational Domain Module<br/>Job Matching, Accommodation, Performance]
    R[AI Recommendation Engine<br/>Coordinated Recommendations + Predictions]
    IAM[Identity and Access Management<br/>User Roles, RBAC Policies, Access Provisioning]
    CI[Clinician Insights<br/>Progression, Adherence, Effectiveness]
    HI[HR Insights<br/>Accommodation Impact, Performance/Risk Trends]
    EI[Employee Insights<br/>Personal Progress, Next Actions, Consent Visibility]
    XD[Cross-Domain Insights<br/>Clinical-Occupational Correlation, Intervention Mapping]
    GI[Governance Insights<br/>RBAC Audits, Consent Compliance, AI Quality]

    A --> P
    A --> G
    G --> GS
    GS --> IAM
    G --> IAM
    G --> P
    P --> C
    P --> I
    P --> O
    R --> I
    I <--> C
    I <--> O
    IAM --> C
    IAM --> O
    IAM --> I
    IAM --> P
    IAM --> R

    CL[Clinician]
    GU[Guest User]
    IN[Individual]
    HR[HR Manager]
    SA[System Admin<br/>Manage Users, Roles, RBAC]
    AN[Analytics and Outcomes]

    CL --> C
    GU --> G
    IN --> P
    HR --> O
    SA --> IAM
    AN --> R

    C --> CI
    O --> HI
    P --> EI
    I --> XD
    IAM --> GI
    R --> GI
```

### Data Insights by Stakeholder (System Use Case Overview)

- Guest user insights: preliminary signal visualization, transparent reason-to-sign-in guidance, and limited pre-auth progress continuity.
- Clinician insights: symptom progression trends, adherence patterns, treatment effectiveness, and clinical-to-work impact signals.
- HR manager insights: accommodation effectiveness, performance trend shifts, absenteeism/retention risk indicators, and support program outcomes.
- Employee insights: personal recovery and work-function progress, recommended next actions, and transparent consent/sharing status.
- Cross-domain insights: correlation between clinical improvements and occupational outcomes, intervention effectiveness mapping, and adjustment timing signals.
- Governance and quality insights: role-based access audit trails, consent compliance monitoring, and AI calibration/fairness monitoring.

---

## DIAGRAM 2: Detailed Use Case Diagram (UML Style)

```mermaid
flowchart LR
    subgraph Actors
        CL[Clinician]
        IN[Individual]
        HR[HR Manager]
        MG[Manager/Supervisor]
        ES[External Systems]
        SA[System Admin]
    end

    subgraph System[Healthcare-HR Bridge System]
        U0((UC0: Guest onboarding and trust-building))
        U0A((UC0A: Complete 10-question FHIR preliminary questionnaire))
        U0B((UC0B: Use capped AI assistant (max 3 guest turns)))
        U0C((UC0C: Temporary guest session persistence with 24h TTL))
        U0D((UC0D: Authentication gate and redirect reasoning banner))
        U1((UC1: Initial diagnosis with coordinated planning))
        U2((UC2: Generate clinical assessment with occupational context))
        U3((UC3: Validate and share assessment results))
        U4((UC4: Generate coordinated recommendations))
        U5((UC5: Track interventions in both domains))
        U6((UC6: Monitor outcomes and cross-domain sync))
        U7((UC7: Trigger bidirectional feedback loops))
        U8((UC8: Comparative effectiveness insights))
        U9((UC9: Predict risks and recommend adjustments))
        U10((UC10: Support career planning and progression))
        U11((UC11: Integrate with EHR, HRIS, assessment tools))
    end

    IN --> U0
    IN --> U0A
    IN --> U0B
    IN --> U0C
    IN --> U0D
    CL --> U1
    CL --> U2
    IN --> U3
    IN --> U4
    HR --> U4
    HR --> U5
    HR --> U6
    MG --> U6
    MG --> U9
    MG --> U10
    ES --> U11
    SA --> U11
    SA --> U7

    U0 --> U0A
    U0 --> U0B
    U0A --> U0D
    U0B --> U0D
    U0C --> U0D
    U0D --> U1
```

---

## DIAGRAM 2A: Guest Pre-Auth to Authenticated Screening Flow

```mermaid
flowchart LR
    W[Welcome Page] --> G[Browse as Guest]
    G --> GP[Guest Profile Page]

    GP --> Q[Guest Questionnaire<br/>10 FHIR-aligned items]
    GP --> C[Guest AI Chat Assistant]

    C --> C1{Guest chat turns used < 3?}
    C1 -->|Yes| C2[Continue guest chat]
    C2 --> C
    C1 -->|No| A[Redirect to Authentication]

    Q --> Q1{All 10 answers + consent?}
    Q1 -->|No| Q
    Q1 -->|Yes| R[Show Preliminary Results Visualization]
    R --> A

    A --> B[Auth Page Banner with reason + 5s countdown]
    B --> L[User signs in]
    L --> S[Resume to Screening Page]

    GS[(Guest Session Store<br/>localStorage + 24h TTL)]
    GP -. persist turns/intended path .-> GS
    Q -. store preliminary QuestionnaireResponse .-> GS
    A -. read + clear on success .-> GS
```

### Guest Flow Notes (Implemented)

- Guest users can complete a basic 10-question FHIR-structured preliminary questionnaire before authentication.
- Guest AI assistant is capped at 3 turns; on cap reach, user is redirected to authentication.
- Authentication includes contextual redirect reasoning with an auto-hide 5-second countdown banner.
- Temporary guest session state is persisted in localStorage and expires automatically after 24 hours (TTL).
- Post-login flow resumes to the screening route to continue full assessment workflow.

---

## DIAGRAM 3: Sequence Diagram - Initial Diagnosis with Coordinated Planning

```mermaid
sequenceDiagram
    autonumber
    participant CL as Clinician
    participant IN as Individual
    participant SY as Bridge System
    participant HR as HR System
    participant CD as Clinical Dashboard
    participant HD as HR Dashboard

    CL->>IN: Request assessment
    IN->>SY: Provide consent for controlled sharing
    IN->>SY: Complete assessment
    SY-->>CD: Publish results for clinical review
    CL->>SY: Validate AI clinical interpretation
    SY->>SY: Run coordinated analysis (clinical + occupational)
    SY-->>HD: Send coordinated report
    CL->>IN: Share treatment plan
    SY-->>HR: Alert HR for accommodation planning
    HR->>HD: Create workplace support plan
    SY->>SY: Link clinical interventions with accommodations
    SY-->>CD: Enable shared outcome tracking
    SY-->>HD: Enable shared outcome tracking
```

---

## DIAGRAM 4: Sequence Diagram - Existing Employee Underperformance

```mermaid
sequenceDiagram
    autonumber
    participant MG as Manager
    participant HR as HR System
    participant EM as Employee
    participant CL as Clinician
    participant WS as Workplace Support
    participant OD as Outcomes Dashboard

    MG->>HR: Report declining performance
    HR->>EM: Start support conversation
    HR->>CL: Refer for clinical assessment
    CL->>EM: Assess and confirm ADHD
    CL-->>HR: Recommend treatment + support structure
    HR->>WS: Start accommodations (task structure, reduced distraction)
    CL->>EM: Start therapy/medication plan
    HR->>OD: Track occupational metrics
    CL->>OD: Track clinical adherence and progress
    OD-->>HR: Feedback: performance improving slowly
    OD-->>CL: Feedback: clinical progress good
    HR->>WS: Increase coaching cadence
    CL->>EM: Refine treatment plan
    OD-->>MG: Converged improvement trend
```

---

## DIAGRAM 5: Data Flow - The Bridge in Action

```mermaid
flowchart TB
    S1[Step 1: AI Assessment]
    S2[Store in Unified Data Layer]
    S3[Clinician Validation]
    C1[Clinical Domain<br/>Diagnosis, severity, interventions]
    O1[Occupational Domain<br/>Role fit, accommodations, constraints]
    B1[Bridge Mapping Engine<br/>Clinical finding to job impact]
    R1[Coordinated Recommendation Engine]
    I1[Intervention Tracking<br/>Clinical adherence + workplace usage]
    M1[Outcome Correlation<br/>Clinical gains to performance gains]
    F1[Feedback Loop Adjustment]

    S1 --> S2 --> S3
    S3 --> C1
    S3 --> O1
    C1 <--> B1
    O1 <--> B1
    B1 --> R1 --> I1 --> M1 --> F1
    F1 --> C1
    F1 --> O1
```

---

## DIAGRAM 6: System Interaction Map

```mermaid
flowchart LR
    EHS[External Health Systems<br/>EHR, Telemedicine, Assessment Tools]
    CLM[Clinical Module]
    CORE[Bridge Core<br/>Unified Profile + Sync + AI Recs]
    HRM[HR/HRIS Module]
    EXT[External HR/Talent Systems]
    ANL[Analytics and Learning Layer]

    EHS -->|HL7/FHIR| CLM
    CLM <--> CORE
    CORE <--> HRM
    HRM <--> EXT
    HRM -->|Performance feedback| CLM
    CORE <--> ANL
    ANL -->|Improved models and insights| CORE
```

---

## DIAGRAM 7: Consent and Privacy Flow

```mermaid
flowchart TB
    IC[Initial Consent Capture]
    EX[Explain findings and sharing purpose]
    GC[Granular Consent Options<br/>Data type, role, duration]
    AC[Access Control Engine<br/>Role + purpose-based authorization]
    CV[Clinician View<br/>Full clinical context]
    HV[HR View<br/>Minimum necessary scope]
    AL[Audit Logging<br/>Who, what, when, why]
    WD[Withdrawal/Update Request]
    RV[Immediate revocation + policy re-evaluation]
    CM[Compliance Monitoring<br/>Violation detection + alerts]

    IC --> EX --> GC --> AC
    AC --> CV
    AC --> HV
    AC --> AL
    GC --> WD --> RV --> AC
    AL --> CM
    AC --> CM
```

---

## DIAGRAM 8: Key Differentiators - Bridge vs Traditional Approach

```mermaid
flowchart LR
    subgraph T[Traditional Siloed Approach]
        T1[Clinical diagnosis]
        T2[Static report to HR]
        T3[Generic accommodations]
        T4[Limited feedback to clinical team]
        T5[Slow and misaligned outcomes]
        T1 --> T2 --> T3 --> T4 --> T5
    end

    subgraph B[Integrated Bridge Approach]
        B1[Clinical + occupational assessment context]
        B2[Real-time synchronized profile]
        B3[Coordinated interventions]
        B4[Shared outcomes dashboard]
        B5[Bidirectional feedback loops]
        B6[Faster and evidence-based outcomes]
        B1 --> B2 --> B3 --> B4 --> B5 --> B6
    end
```

### Key Differences Table

| Dimension | Traditional | Bridge System |
|---|---|---|
| Diagnosis Speed | 3-8 weeks | 1-2 weeks (AI-assisted) |
| HR Involvement | After diagnosis | At assessment stage |
| Data Sharing | One-time static report | Real-time synchronized |
| Accommodation Plan | Generic checklist | Clinically-informed, context-aware |
| Action Timing | Serial | Parallel |
| Feedback | Minimal | Continuous bidirectional loop |
| Success Measurement | Single-domain | Linked clinical + occupational |

---

## SUMMARY: The Bridge in Action Visually

```mermaid
flowchart LR
    subgraph Before[Before: Traditional]
        H1[Healthcare]
        W1[Workplace]
        H1 -. minimal/late handoff .-> W1
    end

    subgraph After[After: Integrated Bridge]
        C2[Clinical Domain]
        U2[Unified Bridge Layer<br/>Profile + Sync + AI]
        O2[Occupational Domain]
        C2 <--> U2
        O2 <--> U2
    end
```

---

## DIAGRAM 9: Companion View - Business Model Canvas (Healthcare-HR Bridge)

```mermaid
flowchart TB
    subgraph KP[Key Partners]
        KP1[Hospitals and Clinics]
        KP2[Employers and HRIS Vendors]
        KP3[EHR and Assessment Tool Providers]
        KP4[Regulators and Compliance Bodies]
    end

    subgraph KA[Key Activities]
        KA1[AI Screening and Risk Scoring]
        KA2[Cross-Domain Data Integration]
        KA3[Care and Workplace Plan Coordination]
        KA4[Outcome Monitoring and Model Calibration]
        KA5[Consent and RBAC Governance]
    end

    subgraph KR[Key Resources]
        KR1[Unified Profile Data Layer]
        KR2[Clinical and Occupational Rules Engine]
        KR3[AI Models and Analytics Platform]
        KR4[Integration APIs and Event Bus]
        KR5[Security, Audit, and IAM Stack]
    end

    subgraph VP[Value Propositions]
        VP1[Faster coordinated diagnosis-to-support pathway]
        VP2[Better employee outcomes and retention]
        VP3[Evidence-based accommodation decisions]
        VP4[Lower fragmentation between healthcare and HR]
        VP5[Auditable, consent-aware data sharing]
    end

    subgraph CR[Customer Relationships]
        CR1[Clinical decision support workflows]
        CR2[HR dashboard and guided playbooks]
        CR3[Employee self-service transparency and consent controls]
        CR4[Admin governance and policy management]
    end

    subgraph CH[Channels]
        CH1[Web Portals and Role-Based Dashboards]
        CH2[API Integrations with EHR/HRIS]
        CH3[Notifications and Case Alerts]
    end

    subgraph CS[Customer Segments]
        CS1[Clinicians and Care Teams]
        CS2[HR Managers and Supervisors]
        CS3[Employees/Individuals]
        CS4[Enterprise Leadership and Risk Teams]
    end

    subgraph COST[Cost Structure]
        C1[Platform Development and Cloud Operations]
        C2[Model Maintenance and Monitoring]
        C3[Integration and Onboarding Costs]
        C4[Compliance, Security, and Auditing]
        C5[Change Management and Training]
    end

    subgraph REV[Revenue and Value Capture]
        R1[SaaS Subscription per Employer Site]
        R2[Implementation and Integration Fees]
        R3[Outcome-Based Service Contracts]
        R4[Cost Savings from Reduced Absence and Turnover]
    end

    KP --> KA
    KR --> KA
    KA --> VP
    VP --> CR
    VP --> CH
    CH --> CS
    VP --> REV
    COST --> REV
```

---

## DIAGRAM 10: Companion View - Causal Loop Diagram (System Thinking)

```mermaid
flowchart LR
    A[Assessment Quality]
    B[Recommendation Relevance]
    C[Intervention Adoption]
    D[Clinical and Work Outcomes]
    E[Stakeholder Trust]
    F[Data Sharing and Completeness]
    G[Model Learning Quality]
    H[False Alerts and Friction]
    I[Consent Confidence]
    J[Program Throughput]

    A -- + --> B
    B -- + --> C
    C -- + --> D
    D -- + --> E
    E -- + --> F
    F -- + --> G
    G -- + --> B

    B -- + --> H
    H -- - --> E

    I -- + --> F
    D -- + --> I

    E -- + --> J
    J -- + --> F

    R1[[R1 Reinforcing: Learning Loop]]
    R2[[R2 Reinforcing: Trust Loop]]
    B1[[B1 Balancing: Alert Fatigue Loop]]

    R1 -.-> G
    R2 -.-> E
    B1 -.-> H
```

---

## DIAGRAM 11: Companion View - Governance and Value Realization Map

```mermaid
flowchart TB
    subgraph GOV[Governance Layer]
        G1[System Admin and Data Governance Board]
        G2[Policy Set: RBAC, Consent, Data Retention]
        G3[Control Set: Access Reviews, Audit Logs, Model Guardrails]
    end

    subgraph OPS[Operational Layer]
        O1[Clinical Workflows]
        O2[HR and Accommodation Workflows]
        O3[Integration and Case Coordination]
        O4[Analytics and Calibration Dashboard]
    end

    subgraph KPI[KPI Layer]
        K1[Time to Coordinated Plan]
        K2[Intervention Adherence Rate]
        K3[Productivity Recovery Trend]
        K4[Retention and Absenteeism Delta]
        K5[Calibration Error and Fairness Metrics]
        K6[Consent and Access Compliance Score]
    end

    subgraph VALUE[Value Realization Layer]
        V1[Employee Wellbeing Improvement]
        V2[Clinical Effectiveness Improvement]
        V3[HR Performance and Retention Gains]
        V4[Risk and Compliance Reduction]
        V5[Enterprise ROI and Program Sustainability]
    end

    G1 --> G2 --> G3
    G3 --> O1
    G3 --> O2
    G3 --> O3
    O1 --> O4
    O2 --> O4
    O3 --> O4
    O4 --> K1
    O4 --> K2
    O4 --> K3
    O4 --> K4
    O4 --> K5
    O4 --> K6
    K1 --> V1
    K2 --> V2
    K3 --> V3
    K4 --> V3
    K5 --> V4
    K6 --> V4
    V1 --> V5
    V2 --> V5
    V3 --> V5
    V4 --> V5
```

