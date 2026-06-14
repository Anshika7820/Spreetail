const express = require('express');

// Create a router, which is like a mini-app just for expenses
const router = express.Router();

// URL: GET /api/expenses
// This gets a list of all expenses
router.get('/', async (req, res) => {
  try {
    // Get the database connection we saved earlier
    const prisma = req.app.locals.prisma;

    // Fetch expenses from the database, and also get the user who paid and the users who split it
    const expenses = await prisma.expense.findMany({
      include: {
        paidBy: true,
        splits: {
          include: { user: true }
        }
      }
    });

    // Send the list of expenses back to the frontend
    res.json(expenses);
  } catch (error) {
    // If something breaks, send an error message
    res.status(500).json({ error: error.message });
  }
});

// URL: POST /api/expenses
// This allows adding a brand new expense manually (not through CSV)
router.post('/', async (req, res) => {
  // Logic to add an expense would go here
  res.json({ message: "This feature is coming soon!" });
});

module.exports = router;
