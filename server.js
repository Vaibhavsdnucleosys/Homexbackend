import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
// Import routes with filenames EXACTLY as shown in your screenshot
import employeeRoutes from "./routes/employeeRoutes.js"; // Correct: Matches employeeRoutes.js
import countryRoutes from "./routes/countryRoutes.js";   // Correct: Matches countryRoutes.js
import stateRoutes from "./routes/stateRoutes.js";     // Correct: Matches stateRoutes.js
import cityRoutes from "./routes/cityRoute.js";        // Correct: Matches cityRoute.js
import areaRoutes from "./routes/areaRoute.js";        // Correct: Matches areaRoute.js
import serviceRoutes from "./routes/serviceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import upcomingPaymentRoutes from "./routes/upcomingPaymentRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import serviceDetailRoutes from "./routes/serviceDetailRoutes.js";
import serviceActionsRoutes from "./routes/serviceActionsRoutes.js"; 
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/booking.js";
import locationRoutes from "./routes/locationRoutes.js";

// Import database config
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://homex.net.in"
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
//   })
// );

// // This middleware is essential for reading the request body in POST/PUT requests
// app.use(express.json());

app.use(cors());


app.use(express.json());

// Connect to the database
connectDB();

// API Routes - This section "activates" your imported routes
app.use("/api/employees", employeeRoutes); // This now correctly points to your employee router
app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upcoming-payments", upcomingPaymentRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/service-details", serviceDetailRoutes);
app.use("/api/service-actions", serviceActionsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/locations", locationRoutes);

// Health check route to confirm the server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "Server is running", 
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));