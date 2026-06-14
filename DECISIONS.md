# DECISIONS.md

This document outlines the significant engineering and product decisions made during the development of SplitIt.

## 1. Import Wizard vs. Silent Auto-Correction
- **Options considered**: 
  1. Fix errors silently and import.
  2. Reject the CSV entirely if errors are found.
  3. Create an interactive "Import Wizard".
- **Decision**: Interactive Import Wizard.
- **Why**: As requested by Meera ("I want to approve anything the app deletes or changes") and Rohan ("No magic numbers"), doing silent corrections violates user trust. Crashing the import fails the assignment. An interactive wizard surfaces all 12+ anomalies with proposed fixes and allows the user to approve them or ignore specific rows before saving to the DB.

## 2. Settlement vs Expense Data Model
- **Options considered**: 
  1. Treat payments (e.g., "Rohan paid Aisha back") as a normal expense with a negative split.
  2. Create a dedicated `Settlement` table.
- **Decision**: Dedicated `Settlement` table.
- **Why**: Settlements are fundamentally different from expenses. They cancel out debts but do not add to the "Total Group Expenses". Keeping them in a separate table ensures that dashboard analytics ("You spent 114,500 INR") remain accurate without artificial inflation from moving money around.

## 3. Styling & Framework
- **Options considered**: 
  1. TailwindCSS.
  2. Vanilla CSS + Design Variables.
- **Decision**: Vanilla CSS.
- **Why**: The project guidelines explicitly prohibited Tailwind unless the user requested it. Thus, a premium, modern design using standard CSS with CSS variables, glassmorphism (`backdrop-filter`), and CSS animations was built from scratch.

## 4. Date Parsing Strategy
- **Options considered**: 
  1. Strict `Date.parse()`.
  2. `date-fns` multi-format parser.
- **Decision**: `date-fns` parser with context inference.
- **Why**: The CSV had dates in `YYYY-MM-DD`, `DD/MM/YYYY`, `MMM DD`, and an ambiguous `04/05/2026`. Strict parsing would fail or produce wildly wrong dates. The `ImportService` checks multiple formats and uses chronological adjacent data context to infer the true date of ambiguous entries.

## 5. Currency Handling
- **Options considered**: 
  1. Convert all amounts to INR at the database level instantly.
  2. Store original currency + amount, compute in INR on the fly.
- **Decision**: Store original currency and amount in the DB (`amount`, `currency`).
- **Why**: Priya explicitly stated: "The sheet pretends a dollar is a rupee. That can't be right." By storing the original currency, the app can apply an exchange rate dynamically or at the time of calculating balances, rather than destroying the original data.
