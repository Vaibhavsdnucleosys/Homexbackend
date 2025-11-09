import Payment from "../models/Payment.js";
import UpcomingPayment from "../models/UpcomingPayment.js";
import Service from "../models/Service.js";

// Get payment dashboard data for employee
export const getPaymentDashboard = async (req, res) => {
    try {
        const { empId } = req.params;
        const employeeId = parseInt(empId);

        const [payments, upcomingPayments, completedServices] = await Promise.all([
            Payment.find({ empId: employeeId }).sort({ date: -1 }).limit(50),
            UpcomingPayment.find({ empId: employeeId }).sort({ scheduledDate: 1 }),
            Service.find({ empId: employeeId, status: 'completed' })
        ]);

        // Calculate statistics
        const completedPayments = payments.filter(p => p.status === 'completed');
        const pendingPayments = payments.filter(p => p.status === 'pending');
        
        const totalEarnings = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalCommission = completedPayments.reduce((sum, payment) => sum + payment.commission, 0);
        const averageEarning = completedPayments.length > 0 ? totalEarnings / completedPayments.length : 0;

        const stats = {
            totalEarnings,
            pendingAmount,
            totalCommission,
            averageEarning,
            completedCount: completedPayments.length,
            pendingCount: pendingPayments.length,
            totalServices: completedServices.length
        };

        // Payment method distribution
        const paymentMethods = {
            credit_card: completedPayments.filter(p => p.paymentMethod === 'credit_card').length,
            cash: completedPayments.filter(p => p.paymentMethod === 'cash').length,
            bank_transfer: completedPayments.filter(p => p.paymentMethod === 'bank_transfer').length
        };

        res.json({
            payments,
            upcomingPayments,
            stats,
            paymentMethods
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get filtered payments
export const getFilteredPayments = async (req, res) => {
    try {
        const { empId } = req.params;
        const { timeFilter = 'all', statusFilter = 'all' } = req.query;
        const employeeId = parseInt(empId);

        let dateFilter = {};
        const now = new Date();

        switch (timeFilter) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { date: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                dateFilter = { date: { $gte: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                dateFilter = { date: { $gte: yearAgo } };
                break;
            default:
                // 'all' - no date filter
                break;
        }

        let query = { empId: employeeId, ...dateFilter };

        if (statusFilter !== 'all') {
            query.status = statusFilter;
        }

        const payments = await Payment.find(query).sort({ date: -1 });

        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ paymentId: parseInt(id) });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create new payment (when service is completed)
export const createPayment = async (req, res) => {
    try {
        const { empId, serviceId, amount, commission, baseRate, bonus, hours, paymentMethod, customer, serviceType } = req.body;

        // Find the highest paymentId to generate new one
        const lastPayment = await Payment.findOne().sort({ paymentId: -1 });
        const newPaymentId = lastPayment ? lastPayment.paymentId + 1 : 1001;

        const payment = new Payment({
            paymentId: newPaymentId,
            empId: parseInt(empId),
            serviceId: parseInt(serviceId),
            amount,
            commission,
            baseRate,
            bonus: bonus || 0,
            hours,
            paymentMethod,
            customer,
            serviceType,
            status: 'completed',
            date: new Date()
        });

        await payment.save();

        // Remove from upcoming payments if exists
        await UpcomingPayment.findOneAndDelete({ serviceId: parseInt(serviceId) });

        res.status(201).json(payment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const payment = await Payment.findOneAndUpdate(
            { paymentId: parseInt(id) },
            { status },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.json(payment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get earnings statistics
export const getEarningsStatistics = async (req, res) => {
    try {
        const { empId } = req.params;
        const { period = 'month' } = req.query; // month, year, week

        const employeeId = parseInt(empId);
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(startDate.getMonth() - 1);
        }

        const earnings = await Payment.aggregate([
            {
                $match: {
                    empId: employeeId,
                    status: 'completed',
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" }
                    },
                    totalEarnings: { $sum: "$amount" },
                    totalCommission: { $sum: "$commission" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        res.json(earnings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Export payments data
export const exportPayments = async (req, res) => {
    try {
        const { empId } = req.params;
        const { format = 'json', startDate, endDate } = req.query;

        const employeeId = parseInt(empId);
        let query = { empId: employeeId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const payments = await Payment.find(query).sort({ date: -1 });

        if (format === 'csv') {
            // Generate CSV data
            const csvData = payments.map(payment => 
                `${payment.paymentId},${payment.serviceType},${payment.customer.name},${payment.amount},${payment.commission},${payment.status},${payment.date}`
            ).join('\n');

            const csvHeaders = 'PaymentID,ServiceType,Customer,Amount,Commission,Status,Date\n';
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=payments-${empId}.csv`);
            res.send(csvHeaders + csvData);
        } else {
            res.json(payments);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};