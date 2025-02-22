const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const dailyReportRoutes = require('./src/routes/dailyReportRoutes');
const materialRoutes = require('./src/routes/materialRoutes');
const receivedRoutes = require('./src/routes/receivedRoutes');
const totalPriceRoutes = require('./src/routes/totalPriceRoutes');
const { connectToMongo } = require('./src/db/mongo'); //optional
const { connectToMongoose } = require('./src/db/mongoose');
const { default: helmet } = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.set('cache-control', 'no-cache, no-store, must-revalidate');
    next();
})

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'index.html'));
});

app.use('/material-submit', materialRoutes);
app.use('/daily-reports', dailyReportRoutes);
app.use('/received', receivedRoutes);
app.use('/total-price', totalPriceRoutes);

app.use((err, _, res, __) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});


(async () => {
    try {
        // optional
        await connectToMongo();
        console.log('Connected to MongoDB');

        await connectToMongoose();
        console.log('Connected to Mongoose');


        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the databases:', error);
        process.exit(1);
    }
})();
