# SplitIt - Shared Expenses App

SplitIt is a robust shared expenses application built to handle real-world, messy financial data with grace. It detects anomalies, flags them to the user, and manages shared groups securely.

## Tech Stack
- **Frontend**: React (Vite), React Router, Vanilla CSS
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL server running locally

### 1. Database Setup
Ensure you have a PostgreSQL database created.
Create a `.env` file in the `backend/` directory:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenses"
```

### 2. Backend
Navigate to the `backend` directory:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*(Note: you can run `npm run dev` to start the backend since I already configured it for you!).*

### 3. Frontend
Navigate to the `frontend` directory in a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The app will be accessible at `http://localhost:5173`.

## AI Usage
Please see `AI_USAGE.md` for details on how AI was utilized during development.
