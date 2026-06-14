# AI Usage

This document outlines how AI (Google DeepMind's Gemini 3.1 Pro via Antigravity IDE) was utilized in the development of SplitIt.

## AI Tools Used
- **Agentic IDE Assistant**: Acted as the primary developer and product manager. It explored the workspace, parsed the CSV data to detect anomalies, generated the database schema, wrote the frontend and backend code, and designed the UI.

## Key Prompts
The initial assignment text was provided directly to the agent. Following that, the agent automatically structured its work using:
- `Implementation Plan Artifact`: Outlined the plan, anomaly detection strategies, and architecture.
- `Task List Artifact`: Managed the checklist of steps during execution.

## Mistakes Made by AI and Corrections

1. **TailwindCSS Assumption**:
   - **Mistake**: The AI initially considered using TailwindCSS for styling because it is the industry standard for rapid React development.
   - **Correction**: Caught this before writing code by reviewing the explicit constraints in the `<web_application_development>` guidelines which stated "Avoid using TailwindCSS unless the USER explicitly requests it". Changed the implementation strategy to use Vanilla CSS with CSS variables, achieving a premium look without the prohibited library.

2. **Parsing Ambiguous Dates**:
   - **Mistake**: The CSV had a date `04/05/2026`. A standard `Date.parse()` or AI assumption might assume May 4th (US format) or April 5th (UK format) arbitrarily.
   - **Correction**: The AI wrote logic in `ImportService.ts` to recognize this specific ambiguity and infer the date (April 5th) based on its chronological position in the CSV (surrounded by late March and mid-April entries).

3. **CSV Parsing Logic for Arrays**:
   - **Mistake**: When parsing the `split_details` (e.g. `Rohan 700; Priya 400; Meera 400`), it is easy to assume a strict regex. The AI initially conceptualized splitting by spaces, which would fail for names with spaces (e.g., `Priya S`).
   - **Correction**: Updated the regex in the `ImportService.ts` `processRows` method to greedily match the name and properly extract the number at the end of the string: `/(.+?)\s+([\d.]+%?)/`. Additionally, ensured `normalizeName` was called to handle `priya` vs `Priya S`.
