const mongoose = require('mongoose');

// Define the schema for total price
const totalPriceSchema = new mongoose.Schema({
    dateRange: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    },
    materials: [{
        materialName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        materialPrice: { type: Number, required: true },
        labourPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        notes: { type: String, default: '' }
    }]
},
{ collection: 'totalPrice' }); // Ensure the collection name is 'totalPrice'

// Create the model for total price
const totalPrice = mongoose.model('totalPrice', totalPriceSchema);

module.exports = totalPrice;
