const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const dailyReportRoutes = require('./src/routes/dailyReportRoutes');  // Import daily report routes
const materialRoutes = require('./src/routes/materialRoutes');  // Import material routes
const receivedRoutes = require('./src/routes/receivedRoutes');  // Import received material routes
const totalPriceRoutes = require('./src/routes/totalPriceRoutes');  // Import total price routes
const { connectToMongo } = require('./src/db/mongo');           // MongoDB native driver
const { connectToMongoose } = require('./src/db/mongoose');     // Mongoose ORM

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and serve static files
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public'))); // Serve static assets

// Serve HTML files (e.g., index.html)
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public/html', 'index.html')); // Adjusted path to index.html
});

// Routes for material-related requests
app.use('/material-submit', materialRoutes); // This route will handle material submission requests
app.use('/daily-reports', dailyReportRoutes); // This route will handle daily report submission requests
app.use('/received', receivedRoutes); // This route will handle received material requests
app.use('/total-price', totalPriceRoutes); // This route will handle total price requests

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start the server after database connections are established
(async () => {
    try {
        // Connect to MongoDB using native driver
        await connectToMongo();
        console.log('Connected to MongoDB');

        // Connect to MongoDB using Mongoose ORM
        await connectToMongoose();
        console.log('Connected to Mongoose');

        // Start the server on the specified port
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the databases:', error);
        process.exit(1); // Exit if any database connection fails
    }
})();
