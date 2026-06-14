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

// URL: POST /api/groups
// Create a new group
router.post('/', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    const { name } = req.body;
    
    const group = await prisma.group.create({
      data: { name }
    });
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// URL: POST /api/groups/:id/members
// Add a user to a group
router.post('/:id/members', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    const groupId = req.params.id;
    const { userId } = req.body;
    
    // Check if member already exists
    let member = await prisma.groupMember.findFirst({
      where: { groupId, userId }
    });
    
    if (!member) {
      member = await prisma.groupMember.create({
        data: { groupId, userId }
      });
    }
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// URL: GET /api/groups/:id/balances
// This calculates who owes whom money within a specific group
router.get('/:id/balances', async (req, res) => {
  try {
    const groupId = req.params.id; // Get the group ID from the URL
    const prisma = req.app.locals.prisma;

    // 1. Fetch the group with its members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 2. Fetch all expenses in this group, along with their splits
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        splits: true
      }
    });

    // 3. Fetch all settlements in this group
    const settlements = await prisma.settlement.findMany({
      where: { groupId }
    });

    // 4. Initialize each member's net balance at 0
    const netBalances = {};
    const memberNames = {};
    group.members.forEach(member => {
      netBalances[member.userId] = 0;
      memberNames[member.userId] = member.user.name;
    });

    // Keep track of total spent in this group
    let totalExpensesAmount = 0;

    // 5. Apply expenses to net balances
    expenses.forEach(expense => {
      // If the currency is USD, we convert to INR (1 USD = 83 INR)
      const rate = expense.currency === 'USD' ? 83 : 1;
      const amountInINR = expense.amount * rate;
      
      totalExpensesAmount += amountInINR;
      
      // Payer gets credited the full amount they paid
      if (netBalances[expense.paidById] !== undefined) {
        netBalances[expense.paidById] += amountInINR;
      }
      
      // Split participants get debited what they owe
      expense.splits.forEach(split => {
        if (netBalances[split.userId] !== undefined) {
          netBalances[split.userId] -= split.owedAmount * rate;
        }
      });
    });

    // 6. Apply settlements to net balances
    settlements.forEach(settlement => {
      const rate = settlement.currency === 'USD' ? 83 : 1;
      const amountInINR = settlement.amount * rate;
      
      // Payer of settlement gets their debt reduced (balance increases)
      if (netBalances[settlement.paidById] !== undefined) {
        netBalances[settlement.paidById] += amountInINR;
      }
      
      // Receiver of settlement gets their credit reduced (balance decreases)
      if (netBalances[settlement.paidToId] !== undefined) {
        netBalances[settlement.paidToId] -= amountInINR;
      }
    });

    // 7. Separate users into debtors and creditors
    const debtors = [];
    const creditors = [];

    Object.keys(netBalances).forEach(userId => {
      const balance = netBalances[userId];
      // Ignore tiny floating point differences
      if (balance < -0.01) {
        debtors.push({ userId, name: memberNames[userId], balance });
      } else if (balance > 0.01) {
        creditors.push({ userId, name: memberNames[userId], balance });
      }
    });

    const suggestedSettlements = [];

    // Sort: biggest debtors and creditors first to minimize transactions
    debtors.sort((a, b) => a.balance - b.balance); // most negative first
    creditors.sort((a, b) => b.balance - a.balance); // most positive first

    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];
      
      const oweAmount = -debtor.balance;
      const creditAmount = creditor.balance;
      
      const transfer = Math.min(oweAmount, creditAmount);
      
      suggestedSettlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(transfer * 100) / 100
      });
      
      debtor.balance += transfer;
      creditor.balance -= transfer;
      
      if (Math.abs(debtor.balance) < 0.01) {
        debtorIdx++;
      }
      if (Math.abs(creditor.balance) < 0.01) {
        creditorIdx++;
      }
    }

    res.json({
      groupName: group.name,
      totalExpenses: Math.round(totalExpensesAmount * 100) / 100,
      members: Object.values(memberNames),
      userBalances: Object.keys(netBalances).map(userId => ({
        userId,
        userName: memberNames[userId],
        balance: Math.round(netBalances[userId] * 100) / 100
      })),
      balances: suggestedSettlements
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
