const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
    plateNumber: {
        type: Number,
        required: true,
        trim: true,
    },
    contractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contractor',
        required: true
    },
    factory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Factory',
        required: true
    },
    factoryCardNumber: {
        type: Number,
        required: true,
        trim: true
    },
    deviceCardNumber: {
        type: Number,
        required: true,
        trim: true
    },
    gateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gate',
        required: true
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, //false // للعسكري فقط
    },
    // registrationType: {
    //     type: String,
    //     enum: ['military'], //'gate_employee',
    //     required: true
    // },
    status: {
        type: String,
        enum: ['registered', 'in_transit', 'delivered', 'cancelled'],
        default: 'registered'
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    canEdit: {
        type: Boolean,
        default: true
    },
    // editDeadline: {
    //     type: Date,
    //     default: function () {
    //         // يمكن التعديل خلال 24 ساعة فقط
    //         const deadline = new Date();
    //         deadline.setHours(deadline.getHours() + 24);
    //         return deadline;
    //     }
    // }
}, {
    timestamps: true
});

// فهرس للبحث السريع
truckSchema.index({ plateNumber: 1 });
truckSchema.index({ contractor: 1 });
truckSchema.index({ factory: 1 });
truckSchema.index({ gateId: 1 });
truckSchema.index({ registeredAt: -1 });

// التحقق من إمكانية التعديل
// truckSchema.methods.canBeEdited = function () {
//     return this.canEdit && new Date() < this.editDeadline;
// };

module.exports = mongoose.model('Truck', truckSchema); 