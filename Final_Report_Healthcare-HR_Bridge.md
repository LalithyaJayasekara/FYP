# Integrated Healthcare–HR Platform for Learning Disorders

## CHAPTER 1 INTRODUCTION

1.1 Prolegomena

CareLink: An AI‑Driven Platform Bridging Healthcare and Workplace Support for Individuals with Learning Disorders proposes a secure, accessible, and intelligent system to close the gap between clinical screening and workplace accommodations. CareLink focuses on practical improvements in continuity of care, timely workplace support, and safe data sharing across clinical and HR boundaries.

Current record and support practices

In many organisations the pathway from initial screening to workplace adjustments remains fragmented: medical and screening notes are often stored in disparate electronic systems or as paper records, and HR records seldom receive structured clinician recommendations automatically. This fragmentation causes repeated assessments, delayed adjustments, and missed opportunities for timely support. Where digital records exist they frequently serve only as repositories without decision‑support, structured handoffs, or the ability to generate actionable summaries for HR and clinical teams.

Global perspective and business value of intelligent digital health

Healthcare technology has moved beyond basic digitization toward intelligent, context‑aware digital health platforms. Advances in large language models (LLMs), retrieval‑augmented generation (RAG), knowledge graphs, and real‑time analytics enable systems that can synthesize clinical records, generate concise summaries, and assist workflow decisioning. When combined with mobile and cloud platforms, these capabilities support proactive screening, personalized guidance, and more efficient clinician‑to‑HR handoffs while preserving human oversight and regulatory compliance.

Proposed system overview — CareLink

CareLink is a mobile‑enabled and web‑accessible platform that integrates intelligent screening, clinician orchestration, and HR case management into a single workflow. The screening module uses structured questionnaires and automated risk scoring to generate explainable recommendations for clinician review; the clinician orchestration module displays concise case summaries, supporting evidence, and suggested actions while providing clear override and annotation mechanisms; and the HR case management module translates clinician recommendations into documented accommodation plans, approval workflows, and outcome tracking with enforced consent and access controls. Underpinning these modules are intelligent automation features for record retrieval, summarization, and task routing, and the architecture is built on modular microservices, secure APIs, and configurable consent scopes to preserve privacy and institutional control.

Objectives and expected benefits

The CareLink project aims to reduce the time between initial screening and implemented workplace adjustments, improve the consistency and documentation of accommodation decisions, empower employees through explicit consent controls and transparent data use, and produce de‑identified analytics to inform policy, training, and resource allocation.


Business perspective: value of intelligent automation

From a business perspective, CareLink’s intelligent automation features function primarily as tools for operational efficiency and decision augmentation: by automating retrieval and summarization of relevant records, the platform reduces clinician review time and shortens the administrative lag between screening and HR actioning; by orchestrating templated workflows and routing tasks, it reduces manual handoffs and rework, lowering processing costs per case; and by standardizing evidence summaries and embedding policy‑aware recommendations, it reduces variation in decisions and strengthens auditability. These operational benefits translate into measurable impact areas—higher clinician throughput, shorter time‑to‑adjustment, and cost savings through reduced absenteeism and administrative overhead—and into strategic advantages such as more reliable, de‑identified analytics for workforce planning and improved employer brand through consistent, evidence‑based accommodation processes. To manage risk, the platform enforces human‑in‑the‑loop decision gates, initially adopts conservative suggestion thresholds with active monitoring of false positive/negative rates, and includes explainability and provenance for every automated output. Implementation requires a pilot measurement plan to establish baseline KPIs, structured change management for clinicians and HR, and a cost model that balances development and governance costs against expected operational and retention savings. In summary, intelligent automation in CareLink serves as a productivity multiplier and consistency enabler, delivering operational, compliance, and strategic benefits when deployed with oversight and governance.

Conclusion

By integrating screening, clinician workflows, and HR case management into a single governed platform, CareLink seeks to transform how organizations identify and support individuals with learning disorders. The system is intended as a pragmatic bridge between current practices and the next generation of intelligent, privacy‑aware health‑workplace systems promoted by global health frameworks.

## 1.3 Research Problem

In many workplaces and clinical settings the pathway from initial screening for learning disorders to workplace accommodation remains fragmented and poorly governed. Screening outputs, clinical notes, and HR records are often stored separately or communicated via informal channels, leading to delayed adjustments, repeated assessments, and inconsistent accommodation decisions. This fragmentation results in measurable harms: reduced employee productivity, increased absenteeism, slowed return‑to‑work processes, and potential legal exposure when consent and data provenance are unclear (see WHO global digital health guidance on integrated systems: https://www.who.int/publications/i/item/9789240116870). Moreover, existing digital solutions—where they exist—tend to focus on record storage rather than decision support and cross‑organizational workflows; as a result, organizations lack an integrated, privacy‑preserving system that translates clinical findings into standardized HR actions while preserving clinician oversight and employee consent.

The absence of an end‑to‑end platform that (a) provides explainable, validated screening results, (b) enforces consent and role‑based access across stakeholders, and (c) operationalizes clinician recommendations into auditable HR case workflows creates both operational inefficiencies and missed opportunities for early intervention. Approaches that enable distributed data use while protecting privacy—such as federated learning and privacy‑preserving analytics—are promising technical patterns for multi‑site development but remain an active research area (see Kairouz et al., federated learning survey: https://doi.org/10.48550/arXiv.1912.04977). Without such a platform, employers cannot reliably convert health signals into accommodation decisions, clinicians spend extra time on administrative routing, and employees remain passive recipients rather than active participants in their accommodation plans. The central research problem addressed by this project is therefore the lack of a secure, interoperable, and human‑centred platform that bridges healthcare screening and HR processes to improve identification, support, and outcomes for individuals with learning disorders.

## 1.4 Research Aim

The primary aim of this research is to design, implement, and evaluate CareLink: an AI‑assisted platform that integrates screening, clinician review, consent management, and HR case workflows to improve the timeliness, consistency, and accountability of workplace accommodations for individuals with learning disorders. CareLink seeks to demonstrate that a governed, explainable decision‑support pipeline—combined with structured HR integration and auditable data flows—can materially reduce time‑to‑adjustment, improve accommodation quality, and maintain regulatory and ethical safeguards. The project will evaluate clinical and operational outcomes and estimate likely organizational return on investment informed by recent market analyses of AI in healthcare (Grand View Research: https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-ai-healthcare-market).

## 1.5 Objectives

To achieve this aim the study will pursue the following objectives:
1. Conduct a requirement and stakeholder analysis to document current screening, clinical, and HR processes, identify gaps in data flows and governance, and establish measurable baseline KPIs (e.g., detection rate, time‑to‑adjustment, clinician time per case).
2. Design a modular CareLink architecture that includes a screening service (explainable risk scoring), consent and identity controls (RBAC and audit logs), clinician orchestration interfaces, and HR case management APIs for operational handoffs.
3. Implement core components of the platform: a screening pipeline with explainability outputs, a clinician review dashboard, a consented data‑sharing mechanism, and an HR case workflow that records decisions and outcomes.
4. Integrate privacy‑preserving practices (data minimization, pseudonymization, encrypted transport) and establish governance protocols for audit, retention, and incident response.
5. Pilot the platform in a controlled organizational setting to evaluate technical performance, workflow impacts, and user acceptance; collect quantitative and qualitative data against the baseline KPIs.
6. Analyse pilot results to estimate operational benefits and return on investment, surface usability and integration issues, and produce recommendations for scale‑up and policy governance.

These objectives combine technical implementation, governance design, and empirical evaluation to ensure CareLink is both usable in practice and evidence‑backed for organizational adoption.

## 2. Literature Review

This section reviews prior work on AI-driven decision support in healthcare and mental health, data‑sharing architectures, and AI‑augmented human resources management (HRM), to position an integrated healthcare–HR platform for learning disorders within existing research.

A. AI and Machine Learning in Healthcare and Mental Health

AI is now widely applied across healthcare in diagnostics, predictive medicine, workflow optimization, and clinical decision‑making [12] [13]. Systematic reviews show that machine learning, especially neural networks, support vector machines, and random forests, dominate applications such as outcome prediction and prognosis, with imaging and electronic health records (EHRs) as primary data sources [12] [13]. 

In mental health specifically, AI‑based clinical decision support systems (CDSS) are emerging but remain under‑studied compared to somatic medicine [16] [11]. Integrative reviews on AI/ML decision support in mental health report small numbers of primary studies and highlight a dominant theme of trust and confidence among clinicians, limited real‑world deployment, and concerns about transparency and user acceptance [16] [11] [17]. Scoping reviews of AI‑enabled mental health tools (e.g., chatbots, NLP systems, LLM‑based agents) show applications across screening, therapeutic support, monitoring, and prevention, often improving access, engagement, and symptom tracking but rarely replacing human care [17].

Overall, the literature supports AI’s potential to enhance diagnosis, triage, and monitoring but stresses the need for rigorous validation, external generalizability, and integration into routine workflows [13] [14] [18].

B. Human Factors, Trust, and User‑Centered Design

Human factors research emphasizes that many AI systems are developed with limited attention to ecological validity and clinician cognition, leading to usability and workflow problems [19]. Mapping reviews indicate that most health‑AI studies focus on user perception, usability, workload, and trust, but few compare AI tools directly against clinical standards or embed them in real work systems [8].

In mental health, clinicians’ trust, system transparency, and human‑in‑the‑loop oversight are repeatedly identified as preconditions for adoption [16] [11]. Multi‑stakeholder reviews of attitudes toward healthcare AI show generally positive views among patients, public, and professionals, yet persistent concerns over data privacy, reduced autonomy, algorithmic bias, and loss of empathy [20]. Stakeholders consistently call for explainability, validation, and clinician and patient involvement throughout development and implementation [16] [18].

These findings imply that any AI platform supporting learning disorders must include user‑centered interface design, explainable models, and explicit mechanisms for clinician override and feedback.

C. Ethical, Legal, and Regulatory Considerations

Narrative and systematic reviews highlight substantial ethical and regulatory challenges in deploying AI in clinical care [21] [22]. 

Key issues include:
- Data privacy and sovereignty under frameworks like HIPAA and GDPR.
- Algorithmic bias and inequity, especially for vulnerable or under‑represented groups.
- Ambiguous liability and accountability for adverse events involving AI.
- Need for robust governance, auditability, and lifecycle monitoring of models [2] [22] [20].

Recent work stresses that governance must move beyond algorithm design to cover contracts, risk allocation, and compliance processes, particularly when integrating AI into complex sociotechnical systems such as hospitals and cross‑organizational platforms [2] [22] [18]. This directly motivates architectures with granular consent, role‑based access control, and traceable decision logging for a healthcare–HR integration use case.

D. Distributed Architectures, Data Sharing, and Federated Learning

Access to diverse, high‑quality data is critical for performant AI models but is constrained by privacy and interoperability issues [4] [15]. Federated learning (FL) has emerged as a promising paradigm for training machine learning models across distributed EHRs without centralizing raw data, aligning with regulatory and trust requirements [7]. Systematic reviews of FL in healthcare show extensive methodological work on secure aggregation, communication efficiency, and privacy protection, but only a small fraction of studies report real‑world clinical deployments [4] [7].

Reviews of AI, distributed systems, and Internet‑of‑Things in healthcare highlight that distributed architectures are widely used for disease diagnosis and monitoring, with accuracy as the dominant performance metric, but operational aspects (governance, integration, maintainability) are less mature [15]. For a microservices‑based platform that bridges healthcare and HR, this literature suggests using privacy‑preserving, distributed learning and clear data‑governance boundaries between organizations.

E. Implementation Barriers, Enablers, and Learning Health Systems

Even when technical performance is strong, implementation of AI into routine clinical workflows is difficult. Mixed‑methods reviews identify barriers across planning, implementation, and sustaining phases, including leadership gaps, lack of buy‑in, misaligned workflows, insufficient training, unclear legal liability, data‑quality problems, and limited evaluation and monitoring [22] [18]. Enablers include strong leadership, change management, stakeholder engagement, iterative evaluation, and integration into existing IT infrastructure and work routines [22] [18].

Within hospitals, systematic reviews of AI implementation using EMR data show that most work remains at the proof‑of‑concept level, with few systems operating on live data in a learning‑health‑system paradigm [18]. Shifting from retrospective model development to continuous, real‑time learning requires robust data pipelines, monitoring, and feedback loops, which are still rare. This gap underlines the need for architectures that support ongoing model updating, performance monitoring, and joint governance between healthcare and HR stakeholders.

F. AI‑Augmented HRM and Workforce Well‑Being

On the HR side, AI‑augmented HRM has expanded rapidly but remains concentrated in routine functions like recruitment and selection, with limited empirical work on strategic outcomes or cross‑functional integration [23]. Reviews highlight uneven sectoral coverage, a weak theoretical foundation, and scarce evidence connecting AI‑enabled HRM to organizational performance [23].

In parallel, concern about healthcare worker mental health has grown, with AI proposed to mitigate burnout, stress, and cognitive overload via workflow improvements [24]. Scoping reviews suggest that tools such as NLP‑supported documentation, AI‑integrated EHRs, and CDSS can reduce administrative burden and enhance job satisfaction, but integration problems, added oversight demands, and trust issues may offset these gains [24].

For learning disorders in the workplace, the overlap between AI‑enabled HRM and health‑system AI is largely unstudied. Existing work implies that integrated solutions must jointly address clinician workload, employee experience, and HR decision‑making while guarding against new inequities, privacy intrusions, or surveillance concerns [24] [23] [20].

## 3. Requirement Analysis

Stakeholders (concise needs):
- Employees:
	- Needs: Clear consent, confidentiality, minimal stigma.
	- Success metric: High opt‑in and low privacy concerns in surveys.
- Clinicians:
	- Needs: Explainable model outputs, workflow integration, override controls.
	- Success metric: Clinician acceptance and measured override rates.
- HR managers:
	- Needs: Actionable, privacy-preserving guidance and auditable case records.
	- Success metric: Reduced time to implement reasonable adjustments.
- IT/Compliance:
	- Needs: Encryption, RBAC, audit logs, compliance mapping (GDPR/HIPAA).
	- Success metric: Security review sign-off and passing audits.

Functional requirements (bulleted, with purpose):
- Secure intake and screening engine — collect questionnaire data and compute risk scores.
- Clinician dashboard — review cases, view explanations, and record clinical decisions.
- HR case workflow — initiate accommodations, track approvals, and record outcomes.
- Consent & access controls — allow employees to manage data sharing and scope.
- Audit logging — record all decisions and data accesses for accountability.

Non-functional requirements (bulleted):
- Privacy & security — encryption, RBAC, and minimal data retention.
- Availability & resilience — services remain responsive for core clinical flows.
- Scalability — support pilot growth to multiple organizational sites.
- Explainability & transparency — model outputs include human‑readable rationales.

Constraints & assumptions (short list):
- Tool is decision support only — not a diagnostic replacement.
- Cross‑organizational sharing requires explicit consent and legal agreements.
- Initial datasets may be synthetic or de‑identified for pilots.

### 3.1 Resource requirements

The successful implementation of CareLink requires coordinated hardware, software, human, financial, time and institutional resources. The following subsection maps the project template to CareLink's technical architecture and pilot needs.

#### 3.1.1 Hardware Resources

- Development machines: modern developer laptops/desktops with at least 16 GB RAM, multi‑core CPUs, and SSD storage (recommended: 32 GB for ML work and parallel containers). Windows/macOS/Linux dev environments should be available for the team.
- Test devices: a set of mobile devices for manual testing including Android phones/tablets (varied API levels) and iOS devices (iPhone/iPad) to validate the mobile UI and native behaviours. Device cloud testing (e.g., Firebase Test Lab, BrowserStack) is recommended to extend coverage.
- Staging and pilot servers: cloud VM instances or managed Kubernetes nodes for hosting microservices, identity/consent services, and analytics. GPUs (e.g., NVIDIA T4/A10) are required for on‑prem or cloud ML workloads when training or tuning large models locally.
- Networking and secure storage: SSL/TLS termination, VPN access for clinical pilot sites, and encrypted block/object storage for audit logs and backups.

#### 3.1.2 Software Resources

- Frontend: the existing `apps/web-frontend` (Vite + React + TypeScript) for clinician/HR dashboards; mobile apps may use responsive web or a cross‑platform stack depending on pilot scope (React Native or Expo if native mobile is required).
- Backend microservices: Node/TypeScript services (existing `apps/ai-screening-service`) for API endpoints, plus optional Python FastAPI services for ML model serving and model explanation endpoints (run under `uvicorn`).
- Data and graph stores: Google Firestore (or alternative cloud document DB) for session/profile data; Neo4j Aura (managed graph DB) for ontology and relationship queries supporting personalized recommendations.
- AI/ML: Google Vertex AI for managed model training/hosting or Vertex Pipelines; LangChain (Python) for orchestration of retrieval‑augmented workflows; model explainability tooling such as SHAP; optional federated learning frameworks for multi‑site pilots.
- Authentication & consent: OAuth2/OpenID Connect and RBAC libraries; secure consent capture and audit logging middleware.
- DevOps & CI/CD: Docker, GitHub Actions / Cloud Build, Kubernetes manifests, Helm charts; infrastructure as code (Terraform) for provisioning cloud resources.
- Design & testing: Figma for UI/UX designs, Jest/RTL for frontend tests, pytest or Jest for backend tests, and load/behavioral test tools for performance verification.

#### 3.1.3 Human Resources

- Principal researcher / project lead: coordinates research, stakeholder engagement, and thesis deliverables.
- Full‑stack developer(s): implement frontend and backend features, integrations, and APIs.
- ML engineer / data scientist: build, validate, and explain screening models; manage training pipelines and model monitoring.
- UX/UI designer: lead co‑design workshops and produce Figma prototypes and accessible interfaces for clinicians and employees.
- Clinical advisors (physicians, psychologists): validate screening instruments, interpretability requirements, and clinical workflows.
- HR & legal advisors: define accommodation workflows, consent forms, and compliance with local employment and data protection laws.
- DevOps / cloud engineer: provision and operate staging/pilot environments, CI/CD, backups, and security hardening.
- Data protection officer / compliance reviewer: ensure GDPR/HIPAA‑like controls, data minimization, and retention policies are met.
- Pilot site coordinators and research assistants: recruit participants, run usability tests, collect survey/interview data, and manage logistics.

#### 3.1.4 Financial Resources

- Cloud services: GCP billing for Firestore, Vertex AI training/hosting, Compute Engine/Kubernetes, and managed Neo4j Aura subscriptions.
- Third‑party services: device farm access (if used), API or data licensing (if external assessment instruments require fees), and monitoring/observability tooling.
- Personnel costs: developer/engineer hours, clinician consultant fees, UX sessions incentives, and travel costs for onsite pilot coordination.
- Operational costs: mobile app store fees (Apple Developer Program, Google Play Console), printing, and administrative expenses for ethical approval and institutional review board submissions.

#### 3.1.5 Time Resources

- Suggested roadmap (8–10 months total, Agile):
	- Months 1–2: detailed requirements gathering, stakeholder workshops, and literature/policy alignment (WHO/GDPR/HIPAA considerations).
	- Months 3–6: iterative development (EPICs → Features → user stories), CI/CD setup, model development and explainability instrumentation.
	- Months 7–8: pilot deployment, usability testing, and data collection in one or two controlled organisational sites.
	- Months 9–10: analysis of pilot data, ROI estimation, governance documentation, and thesis/report writing.

- Management approach: two‑week sprints with sprint reviews, regular clinician/HR demos, and measurable sprint goals tied to baseline KPIs (e.g., time‑to‑adjustment, opt‑in rate, clinician review time).

These resource requirements map the project template to the CareLink architecture and pilot needs; specific quantities (e.g., number of developer days, cloud instance sizes) should be estimated during the planning sprint and adjusted when vendor pricing and pilot scale are fixed.

## 4. Proposed Methodology

High-level approach (bulleted steps):
- Build modular microservices:
	- Screening service: host models and generate explainable scores.
	- Identity/consent service: manage opt‑in, scopes, and pseudonyms.
	- Profile/case service: manage HR cases and documentation.
	- Analytics service: monitor model performance and support tuning.
- Adopt privacy‑preserving patterns:
	- Pseudonymization and minimal data sharing for HR workflows.
	- Optionally use federated learning for multi‑site model training.

Model pipeline (key actions):
- Data ingestion & preprocessing — validate inputs and protect sensitive fields.
- Feature engineering & fairness checks — remove or protect sensitive attributes.
- Model training & explainability — prefer interpretable models or attach SHAP explanations.
- Validation & calibration — use cross‑validation, held‑out tests, and calibration checks.

Human-centered rollout (practical steps):
- Co-design sessions with clinicians and HR to shape UI and workflows.
- Iterative usability testing and clinician training before pilot.
- Define clear override policies and escalation paths for ambiguous cases.

Governance & monitoring (operational controls):
- Consent capture and role-based enforcement on every data access.
- Continuous performance monitoring and scheduled bias audits.
- Maintainable audit logs for legal compliance and incident investigation.

Evaluation metrics:
- Technical: sensitivity, specificity, AUC, calibration, and false positive/negative rates.
- Implementation: opt‑in rate, clinician acceptance, time-to-adjustment, and employee satisfaction.

## 5. Work Plan / Timeline (Gantt Chart)

Below is a concise Gantt chart (Mermaid) showing major phases and indicating tasks completed so far and tasks still to do. Renderable by Markdown viewers that support Mermaid.

```mermaid
gantt
		title Project Timeline — Healthcare–HR Bridge (Quarter view)
		dateFormat  YYYY-MM-DD
		section Planning
		Literature Review              :done,    lr, 2026-01-01, 2026-02-15
		Requirements Analysis          :done,    ra, 2026-02-01, 2026-03-01
		section Development
		Prototype: Screening Service   :active,  ps, 2026-03-01, 2026-05-15
		Identity & Consent Service     :        ic, 2026-04-01, 2026-06-01
		HR Case Management Service     :        hc, 2026-05-01, 2026-07-01
		AI Analytics & Tuning          :        at, 2026-05-15, 2026-08-01
		section Evaluation & Deployment
		Pilot Deployment & Evaluation  :        pd, 2026-07-01, 2026-09-01
		Documentation & Submission     :        ds, 2026-08-15, 2026-09-15
```

Work completed so far:
- Literature review (complete).
- Initial requirements analysis (complete).
- Early prototype work: repository contains `apps/ai-screening-service` and supporting microservice scaffolding; scoring logic and tests exist indicating prototype development underway.

Work to be completed:
- Complete screening-service prototype and full integration with `identity-consent-service`.
- Implement HR case management workflows and web UI pages for clinician/HR user flows.
- Execute pilot deployment, monitoring, and evaluation; finalize documentation.

## 6. Expected Outcomes

Concrete deliverables:
- Prototype system:
	- What: End‑to‑end demo linking screening → clinician review → HR case initiation.
	- Value: Demonstrates feasibility and uncovers integration gaps.
- Technical report:
	- What: Architecture diagrams, data flows, security measures, and model performance figures.
	- Value: Evidence for reviewers and compliance teams.
- Pilot evaluation:
	- What: Metrics on model accuracy, stakeholder feedback, and process outcomes.
	- Value: Empirical basis for decisions about scale‑up.
- Governance recommendations:
	- What: Consent templates, RBAC rules, audit procedures, and monitoring schedules.
	- Value: Operational guidance to reduce legal and ethical risk.

## 7. References

Selected references (replace or expand with full bibliographic entries used in your literature review):

1. World Health Organization. Global strategy on digital health 2020–2027. World Health Organization; 2025. URL: https://www.who.int/publications/i/item/9789240116870
2. European Union. General Data Protection Regulation (GDPR). 2016. URL: https://gdpr.eu/
3. US Department of Health & Human Services. Health Insurance Portability and Accountability Act (HIPAA). URL: https://www.hhs.gov/hipaa/index.html
4. Kairouz P., McMahan HB., et al. Advances and Open Problems in Federated Learning. Foundations and Trends in Machine Learning. 2021. arXiv:1912.04977. DOI: https://doi.org/10.48550/arXiv.1912.04977. URL: https://arxiv.org/abs/1912.04977
5. Cruz‑Gonzalez P., He AW., Lam EP., et al. Artificial intelligence in mental health care: a systematic review of diagnosis, monitoring, and intervention applications. Psychological Medicine. 2025. doi:10.1017/S0033291724003295. PubMed: https://pubmed.ncbi.nlm.nih.gov/39911020/
6. Grand View Research. Artificial Intelligence In Healthcare Market (2026–2033) — market summary and forecasts. 2026. URL: https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-ai-healthcare-market
7. Selected systematic review resources (examples): PubMed search results for "artificial intelligence mental health review": https://pubmed.ncbi.nlm.nih.gov/?term=artificial+intelligence+mental+health+review

---

Appendix: How this report maps to repository

- Screening prototype and scoring code: see `apps/ai-screening-service/src` and `packages/api-contracts/src/scoring-contract.ts`.
- Web UI pages (clinician/HR): see `apps/web-frontend/src/pages`.
- Microservice scaffolding: see top-level `apps/` services and `gateway-service`.

If you want, I can convert this markdown into PDF, add detailed citations with DOIs, or expand the Gantt chart into a printable figure. What would you like next?

