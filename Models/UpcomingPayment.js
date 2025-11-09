import mongoose from "mongoose";

const upcomingPaymentSchema = new mongoose.Schema({
    upcomingId: { type: Number, unique: true },
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
    estimatedAmount: { type: Number, required: true },
    scheduledDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in-progress'],
        default: 'scheduled'
    },
    hours: { type: Number, required: true },
    address: String,
    notes: String
}, {
    timestamps: true
});

upcomingPaymentSchema.index({ empId: 1, scheduledDate: 1 });

export default mongoose.model("UpcomingPayment", upcomingPaymentSchema);