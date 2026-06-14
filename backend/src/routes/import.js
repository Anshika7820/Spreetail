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
    // The frontend sends back the approved list of expenses
    const { expenses } = req.body;
    
    // In a real app, we would take these expenses and save them into the PostgreSQL database here.
    // For this simple demonstration, we just pretend it was successful!
    res.json({ success: true, message: 'Data imported and saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
