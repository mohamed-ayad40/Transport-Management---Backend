const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    totalTrucks: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Factory', factorySchema); 