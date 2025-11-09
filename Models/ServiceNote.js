import mongoose from "mongoose";

const serviceNoteSchema = new mongoose.Schema({
    noteId: { type: Number, unique: true },
    serviceId: { type: Number, required: true },
    empId: { type: Number, required: true },
    note: { type: String, required: true },
    type: {
        type: String,
        enum: ['general', 'customer_communication', 'technical', 'follow_up'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdBy: { type: String, default: 'technician' } // technician, customer, system
}, {
    timestamps: true
});

// Index for efficient queries
serviceNoteSchema.index({ serviceId: 1, createdAt: -1 });
serviceNoteSchema.index({ empId: 1, serviceId: 1 });

export default mongoose.model("ServiceNote", serviceNoteSchema);