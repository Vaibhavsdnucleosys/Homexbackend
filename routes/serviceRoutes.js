import express from "express";
import { 
    getEmployeeServices, 
    updateServiceStatus, 
    addServiceRating 
} from "../controllers/serviceController.js";

const router = express.Router();

router.get("/employee/:empId", getEmployeeServices);
router.patch("/:id/status", updateServiceStatus);
router.post("/:id/rating", addServiceRating);

export default router;