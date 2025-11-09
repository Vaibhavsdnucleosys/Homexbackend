import express from "express";
import {
    getPaymentDashboard,
    getFilteredPayments,
    getPaymentById,
    createPayment,
    updatePaymentStatus,
    getEarningsStatistics,
    exportPayments
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/employee/:empId/dashboard", getPaymentDashboard);
router.get("/employee/:empId/filter", getFilteredPayments);
router.get("/employee/:empId/statistics", getEarningsStatistics);
router.get("/employee/:empId/export", exportPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.patch("/:id/status", updatePaymentStatus);

export default router;