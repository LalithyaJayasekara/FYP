# CareLink — Results and Discussion (Ultra-Condensed)

## IV. RESULTS

### A. Pilot Summary

The pilot included 87 participants (54 employees, 18 clinicians, 15 HR managers; **Table I**). From 54 questionnaires, 49 (90.7%) passed guardrails and 5 (9.3%) were inconclusive due to low-evidence or contradiction checks (**Table II**, **Fig. 3**).

**TABLE IV.   PILOT SUBMISSION SUMMARY.**

| Item | Value |
|---|---|
| Total employee submissions | 54 |
| Passed guardrails | 49 (90.7%) |
| Inconclusive after QC | 5 (9.3%) |
| Employee participants | 54 |
| Clinician participants | 18 |
| HR manager participants | 15 |

### B. Model Performance

Dual XGBoost screening performance is reported in **Table V**. Model A (dyslexia) outperformed Model B (dyscalculia): accuracy 0.88 vs 0.85, precision 0.86 vs 0.83, recall 0.91 vs 0.87, F1 0.88 vs 0.85, AUC 0.93 vs 0.90, and false-negative rate 0.09 vs 0.13. This indicates strong screening discrimination with recall-prioritized tuning. Outcome distribution across QC-passed cases: combined risk 12.2%, dyslexia-only 28.6%, dyscalculia-only 16.3%, low-risk 34.7%, and low-confidence escalation 8.2% (**Fig. 5**, **Fig. 6**).

**TABLE V.   SCREENING MODEL PERFORMANCE.**

| Section | Metric / Outcome | Dyslexia Model | Dyscalculia Model | % of QC-Passed Cases |
|---|---|---|---|---|
| Model performance | Accuracy | 0.88 | 0.85 | - |
| Model performance | Precision | 0.86 | 0.83 | - |
| Model performance | Recall | 0.91 | 0.87 | - |
| Model performance | F1-score | 0.88 | 0.85 | - |
| Model performance | AUC | 0.93 | 0.90 | - |
| Model performance | False-negative rate | 0.09 | 0.13 | - |
| Triage outcome | Combined risk | - | - | 12.2 |
| Triage outcome | Dyslexia-only | - | - | 28.6 |
| Triage outcome | Dyscalculia-only | - | - | 16.3 |
| Triage outcome | Low risk | - | - | 34.7 |
| Triage outcome | Low-confidence escalation | - | - | 8.2 |

### C. Workflow and Governance Outcomes

CareLink reduced mean time-to-support from 34.7 to 8.3 days (-76.1%), with significant pre-post improvement (Wilcoxon: Z = -4.12, p < 0.001, r = 0.71). Clinician review median turnaround improved from 72.0 to 18.5 hours; HR decision turnaround improved from 9.4 to 2.9 days (**Table VI**, **Fig. 7**).

Among 28 reviewed high-risk/escalated cases, clinicians confirmed 25 (89.3%) and disagreed with 3 (10.7%), with substantial agreement (Cohen's kappa = 0.74, 95% CI: 0.58-0.90).

**TABLE VI.   WORKFLOW AND GOVERNANCE RESULTS.**

| Metric | Baseline | CareLink | Change |
|---|---|---|---|
| Mean time-to-support (days) | 34.7 | 8.3 | -76.1% |
| Clinician review turnaround (hours) | 72.0 | 18.5 | -74.3% |
| HR decision turnaround (days) | 9.4 | 2.9 | -69.1% |
| Clinician confirmation rate | - | 89.3% | - |
| Cohen's kappa | - | 0.74 | - |

### D. Usability and Trust

Overall usability was high (SUS 80.4, SD 8.6), with mean trust 5.5/7 (**Table VII**, **Fig. 8**). Group SUS scores were employees 81.2, clinicians 77.4, and HR managers 83.6. Qualitative feedback (n = 31) highlighted privacy confidence and workflow improvement, but requested clearer model rationale for clinicians.

**TABLE VII.   USABILITY AND TRUST BY STAKEHOLDER GROUP.**

| Group | SUS | Trust (1-7) |
|---|---|---|
| Employees | 81.2 | 5.6 |
| Clinicians | 77.4 | 5.2 |
| HR managers | 83.6 | 5.8 |
| Overall | 80.4 | 5.5 |

## V. DISCUSSION

CareLink showed strong pilot performance in both technical screening and operational impact. Model quality (AUC 0.93/0.90; recall 0.91/0.87) supports questionnaire-first triage, while clinician agreement (kappa = 0.74) supports governance validity. The main practical gain was speed, with a 76.1% reduction in time-to-support and faster clinician/HR decision cycles.

The primary improvement area is explainability for clinician-facing review, not overall usability. Future versions should add case-level feature attribution, expand to multimodal/federated deployment, and run larger multi-site longitudinal validation.

### Limitations

1. Modest sample size (54 employee submissions).  
2. Clinician-confirmed labels rather than independent gold-standard diagnosis.  
3. Single-site, short-duration pilot.  
4. Questionnaire-only modality with potential self-report bias.

