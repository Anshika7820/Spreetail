require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Import our route files
const authRoutes = require('./routes/auth');
const importRoutes = require('./routes/import');
const expensesRoutes = require('./routes/expenses');
const groupsRoutes = require('./routes/groups');
const settlementsRoutes = require('./routes/settlements');

// Create the database pool and adapter for Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Create the Express app (our backend server)
const app = express();
const port = 3001;

// Allow our frontend to talk to this backend
app.use(cors());

// Tell the server to understand JSON data
app.use(express.json());

// Set up file uploading so we can accept the CSV file
// It will temporarily save files in an 'uploads' folder
const upload = multer({ dest: 'uploads/' });

// Make the database connection available to our routes
app.locals.prisma = prisma;

// --- API Routes (The URLs the frontend will call) ---

// Route for authentication (login)
app.use('/api/auth', authRoutes);

// Route for handling CSV uploads
app.use('/api/import', upload.single('file'), importRoutes);

// Route for getting and adding expenses
app.use('/api/expenses', expensesRoutes);

// Route for getting groups and their balances
app.use('/api/groups', groupsRoutes);

// Route for recording manual settlements
app.use('/api/settlements', settlementsRoutes);

// --- Error Handling ---
// If anything goes wrong, this catches the error and sends a simple message
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.message);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

// Export prisma so other files can use it easily
module.exports = { prisma };
