import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    paymentId: { type: Number, unique: true },
    empId: { type: Number, required: true },
    serviceId: { type: Number, required: true },
    customer: {
        name: String,
        email: String,
        phone: String
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['Plumbing', 'AC Repair', 'Appliance Repair', 'Drain Cleaning', 'Electrical', 'Emergency Plumbing']
    },
    amount: { type: Number, required: true },
    commission: { type: Number, required: true },
    baseRate: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    hours: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['completed', 'pending', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'cash', 'bank_transfer'],
        required: true
    },
    transactionId: String,
    notes: String
}, {
    timestamps: true
});

// Index for efficient queries
paymentSchema.index({ empId: 1, date: -1 });
paymentSchema.index({ empId: 1, status: 1 });

export default mongoose.model("Payment", paymentSchema);