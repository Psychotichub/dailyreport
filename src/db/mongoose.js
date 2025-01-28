const mongoose = require('mongoose');

async function connectToMongoose() {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri, { dbName: 'dailyReport' }); // Specify the database name
    } catch (error) {
        console.error('Error connecting to MongoDB with Mongoose:', error);
        process.exit(1);
    }
}

module.exports = { connectToMongoose };
