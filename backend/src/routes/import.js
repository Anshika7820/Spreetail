const express = require('express');
const { ImportService } = require('../services/ImportService');

// Create a router, which is like a mini-app just for import-related URLs
const router = express.Router();

// Create an instance of the service that holds our business rules
const importService = new ImportService();

// URL: POST /api/import/preview
// This receives the CSV file from the frontend, checks it for problems, and sends back a report
router.post('/preview', async (req, res) => {
  try {
    // Make sure they actually sent a file
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV file.' });
    }

    // Process the file using our service
    const expenses = await importService.parseCsv(req.file.path);
    
    // Send the results back to the frontend so the user can review them
    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// URL: POST /api/import/confirm
// This happens after the user reviews the data and clicks "Approve & Import"
router.post('/confirm', async (req, res) => {
  try {
    const { expenses } = req.body;
    const prisma = req.app.locals.prisma;
    
    // 1. Get or create a default group for the flatmates
    let group = await prisma.group.findFirst({ where: { name: 'Goa Trip + Flatmates' } });
    if (!group) {
      group = await prisma.group.create({ data: { name: 'Goa Trip + Flatmates' } });
    }
    
    // 2. Gather all unique users mentioned in the CSV
    const userNames = new Set();
    expenses.forEach(exp => {
      if (!exp.ignored) {
        if (exp.paidBy) userNames.add(exp.paidBy);
        if (exp.splitWith) {
          exp.splitWith.forEach(name => userNames.add(name));
        }
      }
    });
    
    // 3. Create or find users and group members
    const userMap = {}; // Maps name to user ID
    for (const name of userNames) {
      let user = await prisma.user.findUnique({ where: { name } });
      if (!user) {
        user = await prisma.user.create({ data: { name } });
      }
      userMap[name] = user.id;
      
      // Ensure they are marked as a member of this group
      const existingMember = await prisma.groupMember.findFirst({
        where: { groupId: group.id, userId: user.id }
      });
      if (!existingMember) {
        await prisma.groupMember.create({
          data: { groupId: group.id, userId: user.id }
        });
      }
    }
    
    // 4. Process each expense from the frontend
    for (const exp of expenses) {
      if (exp.ignored) continue;
      
      if (exp.isSettlement) {
        // Settlement: paidBy pays the first person in splitWith (or Aisha if empty)
        const paidToName = exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith[0] : 'Aisha';
        if (!userMap[paidToName] || !userMap[exp.paidBy]) continue;
        
        await prisma.settlement.create({
          data: {
            groupId: group.id,
            paidById: userMap[exp.paidBy],
            paidToId: userMap[paidToName],
            amount: exp.amount,
            currency: exp.currency || 'INR',
            date: new Date(exp.date),
            notes: exp.notes || ''
          }
        });
      } else {
        // Regular Expense
        if (!userMap[exp.paidBy]) continue;
        
        const createdExpense = await prisma.expense.create({
          data: {
            groupId: group.id,
            description: exp.description,
            amount: exp.amount,
            currency: exp.currency || 'INR',
            date: new Date(exp.date),
            notes: exp.notes || '',
            paidById: userMap[exp.paidBy],
            splitType: exp.splitType || 'equal'
          }
        });
        
        // Calculate splits based on type
        let totalUnits = 0;
        let splitMap = {}; // Maps userId to owed amount
        
        const participants = exp.splitWith || [];
        const details = exp.splitDetails || {};
        
        if (exp.splitType === 'equal') {
          const splitAmount = exp.amount / participants.length;
          participants.forEach(name => {
            if (userMap[name]) splitMap[userMap[name]] = splitAmount;
          });
        } else if (exp.splitType === 'share') {
          participants.forEach(name => {
            totalUnits += (details[name] || 1);
          });
          participants.forEach(name => {
            if (userMap[name]) splitMap[userMap[name]] = (exp.amount * (details[name] || 1)) / totalUnits;
          });
        } else if (exp.splitType === 'percentage') {
          participants.forEach(name => {
            const pct = details[name] || 0;
            if (userMap[name]) splitMap[userMap[name]] = (exp.amount * pct) / 100;
          });
        } else if (exp.splitType === 'unequal') {
          participants.forEach(name => {
            if (userMap[name]) splitMap[userMap[name]] = details[name] || 0;
          });
        }
        
        // Insert exact splits into database
        for (const [userId, owedAmount] of Object.entries(splitMap)) {
          await prisma.expenseSplit.create({
            data: {
              expenseId: createdExpense.id,
              userId: userId,
              owedAmount: owedAmount
            }
          });
        }
      }
    }
    
    res.json({ success: true, message: 'Data imported and saved successfully!' });
  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
