---
wr_class: worksheet
---

[DOCUMENT META]

- SOURCE: Lead Call Intake Form
- AS OF: {{ captured_at }}
- UNITS: USD unless noted
- TIMEFRAME: OPEN QUESTION

# Walden Ridge — Lead Call Intake Memo

## 1) Opportunity Snapshot
| Field | Value |
|---|---|
| Property / Project | {{ opportunity.property_name }} |
| Location | {{ opportunity.city }}, {{ opportunity.state }} |
| Brand / Flag | {{ opportunity.brand_flag }} |
| Owner / Issuer | {{ opportunity.owner_entity }} |
| Management Company | {{ opportunity.management_company }} |
| Contact | {{ intake.contact.name }} ({{ intake.contact.role }}) |
| Preferred Follow-Up | {{ intake.next_steps.follow_up }} |

## 2) Scope + Constraints
- **Renovation type:** {{ intake.scope.renovation_type }}
- **Occupancy:** {{ intake.scope.occupancy_status }}
- **Scope buckets:**
  {% for bucket in intake.scope.scope_buckets %}
  - {{ bucket }}
  {% endfor %}
- **Phasing / Constraints:** {{ intake.constraints.phasing }}
- **Quiet hours / guest impact:** {{ intake.constraints.quiet_hours }}

## 3) Procurement / Logistics
| Procurement Area | Provided By | Notes |
|---|---|---|
| Millwork / Casegoods | {{ intake.procurement.casegoods }} | {{ intake.procurement.notes.casegoods }} |
| FF&E | {{ intake.procurement.ffe }} | {{ intake.procurement.notes.ffe }} |
| MEP / Systems | {{ intake.procurement.mep }} | {{ intake.procurement.notes.mep }} |
| Owner Deliverables | {{ intake.procurement.owner_items }} | {{ intake.procurement.notes.owner_items }} |

## 4) Risks + Questions (worksheet)
- **Key Risks:**
  - {{ intake.risks.key_risks }}
- **Outstanding Questions / OPEN QUESTION:**
  - {{ intake.risks.open_questions }}

## 5) Next Steps
1. {{ intake.next_steps.step_one }}
2. {{ intake.next_steps.step_two }}
3. {{ intake.next_steps.step_three }}

> **Notes:** {{ intake.notes }}
