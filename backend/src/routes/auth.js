const express = require('express');
const router = express.Router();

// POST /api/auth/login
// Simple mock login. Finds user by name or creates them if not exists.
router.post('/login', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const normalizedName = name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    let user = await prisma.user.findUnique({ where: { name: normalizedName } });
    if (!user) {
      user = await prisma.user.create({ data: { name: normalizedName } });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/users
// Get all users for a dropdown
router.get('/users', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
