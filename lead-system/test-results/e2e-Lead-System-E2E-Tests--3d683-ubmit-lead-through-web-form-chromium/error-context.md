# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - heading "Lead Enrichment Dashboard" [level=1]
    - generic:
      - generic:
        - heading "Total Leads" [level=3]
        - paragraph: "0"
      - generic:
        - heading "Processed" [level=3]
        - paragraph: "0"
      - generic:
        - heading "Avg Score" [level=3]
        - paragraph: "0.0"
    - generic [ref=e4]:
      - heading "Submit New Lead" [level=2]
      - generic [ref=e5]:
        - textbox "First Name" [active] [ref=e6]
        - textbox "Last Name" [ref=e7]
        - textbox "Email" [ref=e8]
        - textbox "Company" [ref=e9]
        - button "Submit Lead" [ref=e10]
    - generic:
      - heading "System Status" [level=3]
      - paragraph: Lead system running on port 3001. Submit leads above to see AI enrichment, scoring, and routing in action.
  - alert [ref=e11]
```