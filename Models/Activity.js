import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    activityId: { type: Number, unique: true },
    empId: { type: Number, required: true },
    type: {
        type: String,
        enum: ['service_completed', 'rating_received', 'service_scheduled', 'payment_received', 'profile_updated'],
        required: true
    },
    message: { type: String, required: true },
    serviceId: { type: Number },
    metadata: { type: Object }
}, {
    timestamps: true
});

activitySchema.index({ empId: 1, createdAt: -1 });

export default mongoose.model("Activity", activitySchema);