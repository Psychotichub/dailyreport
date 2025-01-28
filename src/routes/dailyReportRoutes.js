const express = require('express');
const router = express.Router();
const dailyReportController = require('../controllers/dailyReportController');
const { getDailyReports, addDailyReport, updateDailyReport, deleteDailyReport, getDailyReportsByDate } = dailyReportController;

// Routes
router.get('/', getDailyReports);  // Get all daily reports
router.post('/', addDailyReport);  // Add a new daily report
router.put('/:id', updateDailyReport);  // Update a daily report by ID
router.delete('/:id', deleteDailyReport);  // Delete a daily report by ID
router.get('/date/:date', getDailyReportsByDate);  // Get daily reports by date

module.exports = router;
