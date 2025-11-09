import Service from "../models/Service.js";

// Get employee schedule with filters
export const getEmployeeSchedule = async (req, res) => {
    try {
        const { empId } = req.params;
        const { view = 'day', date, status } = req.query;
        const employeeId = parseInt(empId);

        let query = { empId: employeeId };
        let dateFilter = {};

        // Handle date filtering based on view
        if (date) {
            const selectedDate = new Date(date);
            
            switch (view) {
                case 'day':
                    const startOfDay = new Date(selectedDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(selectedDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    dateFilter = { 
                        scheduledDate: { 
                            $gte: startOfDay, 
                            $lte: endOfDay 
                        } 
                    };
                    break;
                    
                case 'week':
                    const startOfWeek = new Date(selectedDate);
                    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    
                    dateFilter = { 
                        scheduledDate: { 
                            $gte: startOfWeek, 
                            $lte: endOfWeek 
                        } 
                    };
                    break;
                    
                case 'month':
                    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                    endOfMonth.setHours(23, 59, 59, 999);
                    
                    dateFilter = { 
                        scheduledDate: { 
                            $gte: startOfMonth, 
                            $lte: endOfMonth 
                        } 
                    };
                    break;
                    
                default:
                    // No date filter for 'all' view
                    break;
            }
        }

        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Combine filters
        const finalQuery = { ...query, ...dateFilter };

        const services = await Service.find(finalQuery)
            .sort({ scheduledDate: 1, time: 1 })
            .select('-__v');

        // Calculate schedule statistics
        const stats = {
            total: services.length,
            scheduled: services.filter(s => s.status === 'scheduled').length,
            confirmed: services.filter(s => s.status === 'confirmed').length,
            in_progress: services.filter(s => s.status === 'in_progress').length,
            completed: services.filter(s => s.status === 'completed').length,
            cancelled: services.filter(s => s.status === 'cancelled').length
        };

        res.json({
            services,
            stats,
            view,
            date: date || new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get schedule statistics
export const getScheduleStats = async (req, res) => {
    try {
        const { empId } = req.params;
        const employeeId = parseInt(empId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = await Service.aggregate([
            {
                $match: { 
                    empId: employeeId,
                    scheduledDate: { $gte: today }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalEarnings: { $sum: "$estimatedEarnings" }
                }
            }
        ]);

        // Format stats
        const formattedStats = {
            today: stats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            totalUpcoming: stats.reduce((sum, curr) => sum + curr.count, 0),
            totalEarnings: stats.reduce((sum, curr) => sum + (curr.totalEarnings || 0), 0)
        };

        res.json(formattedStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update service status
export const updateServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, actualEarnings } = req.body;

        const updateData = { status };
        
        if (notes) updateData.notes = notes;
        if (actualEarnings) updateData.actualEarnings = actualEarnings;
        
        // If completing service, set completed date
        if (status === 'completed') {
            updateData.completedDate = new Date();
            updateData.paymentStatus = 'paid';
        }

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(id) },
            updateData,
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Start service (update to in_progress)
export const startService = async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime } = req.body;

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(id) },
            { 
                status: 'in_progress',
                startTime: startTime || new Date()
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Complete service
export const completeService = async (req, res) => {
    try {
        const { id } = req.params;
        const { actualEarnings, notes } = req.body;

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(id) },
            { 
                status: 'completed',
                completedDate: new Date(),
                actualEarnings: actualEarnings,
                notes: notes,
                paymentStatus: 'paid'
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Reschedule service
export const rescheduleService = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledDate, time } = req.body;

        if (!scheduledDate || !time) {
            return res.status(400).json({ message: "Scheduled date and time are required" });
        }

        const service = await Service.findOneAndUpdate(
            { serviceId: parseInt(id) },
            { 
                scheduledDate: new Date(scheduledDate),
                time: time,
                status: 'scheduled' // Reset to scheduled when rescheduling
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get today's schedule
export const getTodaySchedule = async (req, res) => {
    try {
        const { empId } = req.params;
        const employeeId = parseInt(empId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const services = await Service.find({
            empId: employeeId,
            scheduledDate: { 
                $gte: today, 
                $lt: tomorrow 
            },
            status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
        })
        .sort({ time: 1 })
        .select('-__v');

        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get upcoming services (next 7 days)
export const getUpcomingServices = async (req, res) => {
    try {
        const { empId } = req.params;
        const { limit = 10 } = req.query;
        const employeeId = parseInt(empId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const services = await Service.find({
            empId: employeeId,
            scheduledDate: { 
                $gte: today, 
                $lte: nextWeek 
            },
            status: { $in: ['scheduled', 'confirmed'] }
        })
        .sort({ scheduledDate: 1, time: 1 })
        .limit(parseInt(limit))
        .select('-__v');

        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};