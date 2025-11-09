import express from "express";
import {
    confirmService,
    startService,
    completeService,
    getCustomerContact,
    updateServiceStatus,
    getServiceQuickActions,
    rescheduleService
} from "../controllers/serviceActionsController.js";

const router = express.Router();

router.get("/:serviceId/quick-actions", getServiceQuickActions);
router.get("/:serviceId/customer-contact", getCustomerContact);
router.patch("/:serviceId/confirm", confirmService);
router.patch("/:serviceId/start", startService);
router.patch("/:serviceId/complete", completeService);
router.patch("/:serviceId/status", updateServiceStatus);
router.patch("/:serviceId/reschedule", rescheduleService);

export default router;