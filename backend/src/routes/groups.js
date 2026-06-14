const express = require('express');

// Create a router just for groups
const router = express.Router();

// URL: GET /api/groups
// This gets a list of all groups and the people in them
router.get('/', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    
    // Fetch groups from the database, including the members inside them
    const groups = await prisma.group.findMany({
      include: {
        members: {
          include: { user: true }
        }
      }
    });
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// URL: GET /api/groups/:id/balances
// This calculates who owes whom money within a specific group
router.get('/:id/balances', async (req, res) => {
  try {
    const groupId = req.params.id; // Get the group ID from the URL
    
    // Calculate balances for the group
    // In a full app, we would sum up all expenses and settlements to figure out
    // the simplest way people can pay each other back.
    // For now, we return an empty list as a placeholder.
    res.json({ balances: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
