const express = require('express');
const router = express.Router();

// POST /api/settlements
// Create a new settlement (payment from one user to another)
router.post('/', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    const { groupId, paidById, paidToId, amount, currency, notes, date } = req.body;
    
    if (!groupId || !paidById || !paidToId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        paidById,
        paidToId,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        date: date ? new Date(date) : new Date(),
        notes: notes || 'Manual Settlement'
      }
    });
    
    res.json(settlement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
