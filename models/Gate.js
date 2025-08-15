const mongoose = require('mongoose');

const GateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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

module.exports = mongoose.model('Gate', GateSchema); 