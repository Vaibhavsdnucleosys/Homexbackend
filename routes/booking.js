import express from "express";
import {
  createBooking,
  getAllBookings,
  getUserBookings,
  updateBookingStatus,
  deleteBooking,
  addBookingReview,
  getAvailableSlots
} from "../controllers/bookingController.js";
import Service from "../models/Service.js";

const router = express.Router();

// ✅ Get available slots with city and area filtering
router.get("/available-slots", getAvailableSlots);

// ✅ Create a new booking
router.post("/", createBooking);

// ✅ Test booking endpoint
router.post("/test-booking", async (req, res) => {
  try {
    console.log('🧪 [TEST] Testing booking system...');
    
    // Test with minimal valid data
    const testBooking = {
      serviceId: "65a1b2c3d4e5f67890123456", // Use a real service ID from your database
      contactInfo: {
        fullName: "Test User",
        phoneNumber: "+1234567890",
        email: "test@example.com"
      },
      location: {
        country: "United States",
        state: "California", 
        city: "Los Angeles",
        area: "Downtown",
        completeAddress: "123 Test St"
      },
      schedule: {
        preferredDate: "2025-01-15",
        timeSlot: "10:00 AM - 12:00 PM"
      },
      paymentMethod: "cash"
    };

    // Simulate the createBooking logic
    const service = await Service.findOne(); // Get any service
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "No services found in database"
      });
    }

    // Generate booking ID
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const bookingId = `TEST${timestamp}${random}`;

    res.status(200).json({
      success: true,
      message: "Booking system test successful",
      testData: testBooking,
      serviceFound: service.title,
      generatedBookingId: bookingId
    });

  } catch (error) {
    console.error('❌ [TEST] Booking test failed:', error);
    res.status(500).json({
      success: false,
      message: "Booking test failed",
      error: error.message
    });
  }
});

// ✅ Get all bookings (Admin or Employee view)
router.get("/", getAllBookings);

// ✅ Get bookings for a specific user
router.get("/user/:userId", getUserBookings);

// ✅ Update booking status (Admin/Employee)
router.put("/:id/status", updateBookingStatus);

// ✅ Delete a booking
router.delete("/:id", deleteBooking);

// ✅ Add a review/rating after service completion
router.post("/:id/review", addBookingReview);

export default router;