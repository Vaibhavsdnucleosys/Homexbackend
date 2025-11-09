import Service from "../models/Service.js";
import ServiceNote from "../models/ServiceNote.js";
import Activity from "../models/Activity.js";

// Confirm service
export const confirmService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { notes } = req.body;

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(serviceId) },
            { 
                status: 'confirmed',
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Add confirmation note if provided
        if (notes) {
            const lastNote = await ServiceNote.findOne().sort({ noteId: -1 });
            const newNoteId = lastNote ? lastNote.noteId + 1 : 6001;

            await ServiceNote.create({
                noteId: newNoteId,
                serviceId: parseInt(serviceId),
                empId: service.empId,
                note: `Service confirmed: ${notes}`,
                type: 'general',
                priority: 'medium',
                createdBy: 'technician'
            });
        }

        // Log activity
        await Activity.create({
            empId: service.empId,
            type: 'service_scheduled',
            message: `Confirmed ${service.serviceType} service for ${service.customer.name}`,
            serviceId: service.serviceId
        });

        res.json({
            message: "Service confirmed successfully",
            service: service
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Start service
export const startService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { startTime, notes } = req.body;

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(serviceId) },
            { 
                status: 'in_progress',
                startTime: startTime || new Date(),
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Add start service note if provided
        if (notes) {
            const lastNote = await ServiceNote.findOne().sort({ noteId: -1 });
            const newNoteId = lastNote ? lastNote.noteId + 1 : 6001;

            await ServiceNote.create({
                noteId: newNoteId,
                serviceId: parseInt(serviceId),
                empId: service.empId,
                note: `Service started: ${notes}`,
                type: 'technical',
                priority: 'medium',
                createdBy: 'technician'
            });
        }

        // Log activity
        await Activity.create({
            empId: service.empId,
            type: 'service_scheduled',
            message: `Started ${service.serviceType} service for ${service.customer.name}`,
            serviceId: service.serviceId
        });

        res.json({
            message: "Service started successfully",
            service: service
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Complete service
export const completeService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { actualEarnings, notes, completionTime } = req.body;

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(serviceId) },
            { 
                status: 'completed',
                completedDate: completionTime || new Date(),
                actualEarnings: actualEarnings,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Add completion note if provided
        if (notes) {
            const lastNote = await ServiceNote.findOne().sort({ noteId: -1 });
            const newNoteId = lastNote ? lastNote.noteId + 1 : 6001;

            await ServiceNote.create({
                noteId: newNoteId,
                serviceId: parseInt(serviceId),
                empId: service.empId,
                note: `Service completed: ${notes}`,
                type: 'general',
                priority: 'medium',
                createdBy: 'technician'
            });
        }

        // Log activity
        await Activity.create({
            empId: service.empId,
            type: 'service_completed',
            message: `Completed ${service.serviceType} service for ${service.customer.name}`,
            serviceId: service.serviceId,
            metadata: { earnings: actualEarnings }
        });

        res.json({
            message: "Service completed successfully",
            service: service
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get service customer contact info
export const getCustomerContact = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await Service.findOne({ serviceId: parseInt(serviceId) })
            .select('customer serviceType');

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json({
            customer: service.customer,
            serviceType: service.serviceType
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update service status
export const updateServiceStatus = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updateData = { status, updatedAt: new Date() };

        // Set completion date if completing service
        if (status === 'completed') {
            updateData.completedDate = new Date();
        }

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(serviceId) },
            updateData,
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Add status change note if provided
        if (notes) {
            const lastNote = await ServiceNote.findOne().sort({ noteId: -1 });
            const newNoteId = lastNote ? lastNote.noteId + 1 : 6001;

            await ServiceNote.create({
                noteId: newNoteId,
                serviceId: parseInt(serviceId),
                empId: service.empId,
                note: `Status changed to ${status}: ${notes}`,
                type: 'general',
                priority: 'medium',
                createdBy: 'technician'
            });
        }

        // Log activity
        await Activity.create({
            empId: service.empId,
            type: 'service_scheduled',
            message: `Updated ${service.serviceType} service status to ${status} for ${service.customer.name}`,
            serviceId: service.serviceId
        });

        res.json({
            message: `Service status updated to ${status}`,
            service: service
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get service quick actions data
export const getServiceQuickActions = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await Service.findOne({ serviceId: parseInt(serviceId) })
            .select('serviceId serviceType status customer scheduledDate time duration estimatedEarnings empId');

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Format response for frontend
        const serviceData = {
            id: service.serviceId,
            serviceId: service.serviceId,
            serviceType: service.serviceType,
            status: service.status,
            customer: service.customer.name,
            customerPhone: service.customer.phone,
            scheduledDate: service.scheduledDate,
            time: service.time,
            duration: service.duration,
            estimatedEarnings: service.estimatedEarnings,
            address: service.customer.address
        };

        res.json(serviceData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reschedule service
export const rescheduleService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { scheduledDate, time, notes } = req.body;

        if (!scheduledDate || !time) {
            return res.status(400).json({ message: "Scheduled date and time are required" });
        }

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(serviceId) },
            { 
                scheduledDate: new Date(scheduledDate),
                time: time,
                status: 'scheduled', // Reset to scheduled when rescheduling
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Add reschedule note if provided
        if (notes) {
            const lastNote = await ServiceNote.findOne().sort({ noteId: -1 });
            const newNoteId = lastNote ? lastNote.noteId + 1 : 6001;

            await ServiceNote.create({
                noteId: newNoteId,
                serviceId: parseInt(serviceId),
                empId: service.empId,
                note: `Service rescheduled to ${new Date(scheduledDate).toLocaleDateString()} at ${time}: ${notes}`,
                type: 'general',
                priority: 'medium',
                createdBy: 'technician'
            });
        }

        // Log activity
        await Activity.create({
            empId: service.empId,
            type: 'service_scheduled',
            message: `Rescheduled ${service.serviceType} service for ${service.customer.name}`,
            serviceId: service.serviceId
        });

        res.json({
            message: "Service rescheduled successfully",
            service: service
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};