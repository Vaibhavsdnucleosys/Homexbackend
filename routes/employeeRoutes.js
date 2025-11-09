import express from "express";
import { 
    searchEmployees, 
    createEmployee,
    updateEmployeeProfile, 
    deleteEmployee
} from "../controllers/employeeController.js";

const router = express.Router();

// Base URL for this router is '/api/employees' (defined in server.js)

// GET /api/employees
router.get("/", searchEmployees);

// POST /api/employees
router.post("/", createEmployee);

// PUT /api/employees/:id
router.put("/:id", updateEmployeeProfile);

// DELETE /api/employees/:id
router.delete("/:id", deleteEmployee);

export default router;