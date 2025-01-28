const TotalPrice = require('../models/totalPrice');  // Import Mongoose model

// Get all daily reports
const getTotalPrice = async (req, res) => {
    try {
        const total = await TotalPrice.find();
        res.status(200).json(total);
    } catch (error) {
        console.error('Error fetching total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new daily reports
const addTotalPrice = async (req, res) => {
    try {
        const { materials } = req.body;

        console.log('Received materials:', materials); // Log the received materials

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({ message: 'Invalid materials data.' });
        }

        const savedMaterials = await TotalPrice.insertMany(materials);
        res.status(201).json(savedMaterials);
    } catch (error) {
        console.error('Error saving total price:', error);
        console.error('Request body:', req.body);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get daily reports by date
const getTotalPriceByDate = async (req, res) => {
    const { date } = req.params;
    try {
        const totalPrice = await TotalPrice.find({ date: new Date(date).toISOString().split('T')[0] });
        res.status(200).json(totalPrice);
    } catch (error) {
        console.error('Error fetching total price by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTotalPrice, addTotalPrice, getTotalPriceByDate };
