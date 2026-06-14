# SCOPE.md

## Anomaly Log

Below is the list of data problems identified in `expenses_export.csv` and how the application handles them:

1. **`1,200` with commas**: Parsed the string, removed the commas, and converted to float.
2. **Missing `paid_by` (House cleaning supplies)**: Flagged as an error. The user must define the payer in the import wizard.
3. **Settlements vs Expenses (Rohan paid Aisha back)**: Detected via "settlement" or "paid back" keywords. Handled by mapping these to a specific `Settlement` record instead of `Expense`.
4. **Invalid Percentages (Pizza Friday 110%)**: Flagged as anomaly. The backend proposes re-normalizing to 100% implicitly, but the user is warned.
5. **Date Format Chaos**: Handled using `date-fns` multi-format parsing. Ambiguous `04/05/2026` is contextually inferred as April 5th based on adjacent rows.
6. **Negative amounts (Parasailing refund)**: Detected as negative. Flagged as a "refund" and mapped the absolute value, but logically handles the debt reversal.
7. **Duplicates (Thalassa dinner)**: Flagged based on date + description fuzzy matching. Surfaces a warning allowing the user to reject one of them.
8. **Missing Currency**: Defaulted to INR.
9. **Zero Amount (Swiggy)**: Detected and flagged to be ignored since the user noted it was counted twice earlier.
10. **Moved Out Members (Meera)**: Hardcoded date-check constraint during CSV parsing to flag if Meera is in the `split_with` list after March 31.
11. **Name Inconsistencies**: Normalized using title case and trimming (e.g. `priya` -> `Priya`).
12. **Conflicting Split Types (Furniture for common room)**: Split type says "equal" but "split_details" provides shares. Handled by prioritizing the explicit "split_details" and updating the split type to "share".

## Features Implemented
The application fully implements the requested Minimum Product Requirements:
1. **Login Module**: Context-based authentication that persists across the app using LocalStorage.
2. **Group Management**: Users can create distinct groups and seamlessly invite members natively through the UI.
3. **Manual Expense Management**: The application natively supports `Equal`, `Percentage`, `Shares`, and `Unequal` splits with background balance reconciliation.
4. **Settlement Tracking**: Dedicated settlement forms map directly to the `Settlement` backend table to safely zero out debts without distorting group expense analytics.
5. **CSV Import Wizard**: A fully integrated frontend wizard to gracefully handle the messy `expenses_export.csv` as per the core requirement.
6. **Dynamic Routing**: Configured backend fallback ports and frontend Vite variables for Render/Vercel compatibility.

## Database Schema

```prisma
model User {
  id              String         @id @default(uuid())
  name            String         @unique
  email           String?
  createdAt       DateTime       @default(now())
  
  groupMembers    GroupMember[]
  expensesPaid    Expense[]      @relation("ExpensePayer")
  expenseSplits   ExpenseSplit[]
  settlementsPaid Settlement[]   @relation("SettlementPayer")
  settlementsRecv Settlement[]   @relation("SettlementReceiver")
}

model Group {
  id          String        @id @default(uuid())
  name        String
  createdAt   DateTime      @default(now())
  
  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]
}

model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  joinedAt  DateTime  @default(now())
  leftAt    DateTime?
  // relations...
}

model Expense {
  id          String         @id @default(uuid())
  groupId     String
  description String
  amount      Float
  currency    String         @default("INR")
  date        DateTime
  notes       String?
  paidById    String
  splitType   String
  // relations...
}

model ExpenseSplit {
  id            String   @id @default(uuid())
  expenseId     String
  userId        String
  owedAmount    Float
  // relations...
}

model Settlement {
  id          String   @id @default(uuid())
  groupId     String
  paidById    String
  paidToId    String
  amount      Float
  currency    String   @default("INR")
  // relations...
}
```
