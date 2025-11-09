import express from "express";
import {
  createBooking,
  getAllBookings,
  getUserBookings,
  updateBookingStatus,
  deleteBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

// Public route: Create booking
router.post("/create", createBooking);

// Get all bookings (Admin/Employee)
router.get("/", getAllBookings);

// Get bookings of a single user
router.get("/user/:userId", getUserBookings);

// Update booking status
router.put("/update/:id", updateBookingStatus);

// Delete booking
router.delete("/delete/:id", deleteBooking);

export default router;
