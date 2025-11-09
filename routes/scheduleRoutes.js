import express from "express";
import {
    getEmployeeSchedule,
    getScheduleStats,
    updateServiceStatus,
    startService,
    completeService,
    rescheduleService,
    getTodaySchedule,
    getUpcomingServices
} from "../controllers/scheduleController.js";

const router = express.Router();

router.get("/employee/:empId", getEmployeeSchedule);
router.get("/employee/:empId/stats", getScheduleStats);
router.get("/employee/:empId/today", getTodaySchedule);
router.get("/employee/:empId/upcoming", getUpcomingServices);
router.patch("/:id/status", updateServiceStatus);
router.patch("/:id/start", startService);
router.patch("/:id/complete", completeService);
router.patch("/:id/reschedule", rescheduleService);

export default router;