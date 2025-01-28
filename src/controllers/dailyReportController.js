const DailyReport = require('../models/dailyreport');  // Import Mongoose model

// Get all daily reports
const getDailyReports = async (req, res) => {
    try {
        // Fetch all daily reports from MongoDB using Mongoose
        const dailyReports = await DailyReport.find();
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};  

// Add new daily reports
const addDailyReport = async (req, res) => {
    const { materials } = req.body;

    // Validation: Check if materials array is provided
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Create new daily report documents using Mongoose
        const newDailyReports = await DailyReport.insertMany(materials);
        res.status(201).json(newDailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }   
};

// Update an existing daily report
const updateDailyReport = async (req, res) => {
    const { date, materialName, quantity, notes } = req.body;
    const { id } = req.params;

    // Validation: Check if required fields are provided
    if (!date || !materialName || !quantity) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Find and update the daily report by ID using Mongoose
        const updatedDailyReport = await DailyReport.findByIdAndUpdate(
            id,
            { date, materialName, quantity, notes },
            { new: true, runValidators: true }  // Ensure we return the updated document and validate
        );
        
        if (!updatedDailyReport) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(200).json(updatedDailyReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing daily report
const deleteDailyReport = async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the daily report by ID using Mongoose
        const deletedDailyReport = await DailyReport.findByIdAndDelete(id);
        
        if (!deletedDailyReport) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily reports by date
const getDailyReportsByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Fetch daily reports by date from MongoDB using Mongoose
        const dailyReports = await DailyReport.find({ date: new Date(date).toISOString() });
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDailyReports, addDailyReport, updateDailyReport, deleteDailyReport, getDailyReportsByDate };
