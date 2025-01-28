const express = require('express');
const router = express.Router();
const totalPriceController = require('../controllers/totalPriceController');
const { getTotalPrice, addTotalPrice, getTotalPriceByDate } = totalPriceController;

// Routes
router.get('/', getTotalPrice);  // Get all daily reports
router.post('/', addTotalPrice);  // Add new total price
router.get('/date/:date', getTotalPriceByDate);  // Get daily reports by date

module.exports = router;
