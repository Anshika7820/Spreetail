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
  try {
    const prisma = req.app.locals.prisma;
    const { groupId, description, amount, currency, date, paidById, splitType, splits } = req.body;
    
    if (!groupId || !description || !amount || !paidById || !splitType || !splits || splits.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const parsedAmount = parseFloat(amount);
    
    const createdExpense = await prisma.expense.create({
      data: {
        groupId,
        description,
        amount: parsedAmount,
        currency: currency || 'INR',
        date: date ? new Date(date) : new Date(),
        paidById,
        splitType
      }
    });
    
    // Calculate and insert splits based on type
    let totalUnits = 0;
    let splitMap = {}; // Maps userId to owed amount
    
    if (splitType === 'equal') {
      const splitAmount = parsedAmount / splits.length;
      splits.forEach(s => {
        splitMap[s.userId] = splitAmount;
      });
    } else if (splitType === 'share') {
      splits.forEach(s => {
        totalUnits += (parseFloat(s.value) || 1);
      });
      splits.forEach(s => {
        splitMap[s.userId] = (parsedAmount * (parseFloat(s.value) || 1)) / totalUnits;
      });
    } else if (splitType === 'percentage') {
      splits.forEach(s => {
        const pct = parseFloat(s.value) || 0;
        splitMap[s.userId] = (parsedAmount * pct) / 100;
      });
    } else if (splitType === 'unequal') {
      splits.forEach(s => {
        splitMap[s.userId] = parseFloat(s.value) || 0;
      });
    }
    
    for (const [userId, owedAmount] of Object.entries(splitMap)) {
      await prisma.expenseSplit.create({
        data: {
          expenseId: createdExpense.id,
          userId: userId,
          owedAmount: owedAmount
        }
      });
    }
    
    res.json(createdExpense);
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
