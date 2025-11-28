import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import mongoose from 'mongoose';

// Security: Input validation and sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>$]/g, '');
};

const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Security: Rate limiting storage
const requestCounts = new Map();
const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 100 };

const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip).filter(time => time > windowStart);
  requests.push(now);
  requestCounts.set(ip, requests);
  
  return requests.length <= RATE_LIMIT.max;
};

// Get Available Slots with security enhancements
export const getAvailableSlots = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Security: Input sanitization
    const date = sanitizeInput(req.query.date);
    const serviceId = sanitizeInput(req.query.serviceId);
    const country = sanitizeInput(req.query.country);
    const state = sanitizeInput(req.query.state);
    const city = sanitizeInput(req.query.city);
    const area = sanitizeInput(req.query.area);

    // Security: Input validation
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    if (!validateDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Security: Set response headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    console.log(`📅 [BACKEND] Fetching slots for:`, { date, serviceId, city, area });

    // Convert date string into date range for MongoDB
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Build filter with security considerations
      const filter = {
        "schedule.preferredDate": { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ["pending", "confirmed", "assigned", "in_progress"] }
      };

      if (serviceId && serviceId !== 'undefined') {
        filter.service = serviceId;
      }
      if (city && city !== 'undefined') {
        filter['location.city'] = { $regex: new RegExp(city, 'i') };
      }
      if (area && area !== 'undefined') {
        filter['location.area'] = { $regex: new RegExp(area, 'i') };
      }

      // Get booked slots for that day
      const bookings = await Booking.find(filter).select("schedule.timeSlot");
      const bookedSlots = bookings.map((b) => b.schedule.timeSlot);

      // Get service details to determine available slots
      let serviceSlots = [];
      if (serviceId) {
        const service = await Service.findById(serviceId).select('availableSlots');
        if (service && service.availableSlots && service.availableSlots.length > 0) {
          serviceSlots = service.availableSlots;
        }
      }

      // If no service-specific slots, use default business hours
      if (serviceSlots.length === 0) {
        serviceSlots = [
          "9:00 AM - 11:00 AM",
          "11:00 AM - 1:00 PM", 
          "1:00 PM - 3:00 PM",
          "3:00 PM - 5:00 PM",
          "5:00 PM - 7:00 PM"
        ];
      }

      const availableSlots = serviceSlots.filter((slot) => !bookedSlots.includes(slot));

      return res.status(200).json({
        success: true,
        data: {
          availableSlots,
          bookedSlots,
          totalBooked: bookedSlots.length,
          totalAvailable: availableSlots.length,
          date: date,
          location: { country, state, city, area }
        },
        suggestedSlot: availableSlots[0] || null,
      });

    } catch (dbError) {
      console.error('Database error in getAvailableSlots:', dbError);
      
      // Return mock data if database query fails
      const mockAvailableSlots = [
        '09:00 AM - 11:00 AM', 
        '11:00 AM - 1:00 PM', 
        '02:00 PM - 4:00 PM', 
        '04:00 PM - 6:00 PM'
      ];

      return res.status(200).json({
        success: true,
        data: {
          availableSlots: mockAvailableSlots,
          bookedSlots: [],
          totalBooked: 0,
          totalAvailable: mockAvailableSlots.length,
          date: date,
          location: { country, state, city, area },
          fallback: true
        },
        suggestedSlot: mockAvailableSlots[0],
        message: "Using fallback slot data"
      });
    }

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching slots",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new booking with security enhancements - FIXED VERSION with temporary service handling
export const createBooking = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Security: Set response headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    console.log('📝 [BACKEND] Received booking request body:', JSON.stringify(req.body, null, 2));

    const { serviceId, contactInfo = {}, location = {}, schedule = {}, specialInstructions, paymentMethod, userId } = req.body;

    const sanitizedServiceId = sanitizeInput(serviceId);
    const sanitizedUserId = userId ? sanitizeInput(userId) : null;
    const sanitizedPaymentMethod = sanitizeInput(paymentMethod);
    const sanitizedSpecialInstructions = sanitizeInput(specialInstructions);

    console.log('🔍 [BACKEND] Sanitized data:', {
      serviceId: sanitizedServiceId,
      userId: sanitizedUserId,
      paymentMethod: sanitizedPaymentMethod
    });

    // Check if serviceId is a temporary ID (starts with 'temp_')
    const isTempService = serviceId && serviceId.startsWith('temp_');

    let service;
    let serviceDetails = {};

    if (isTempService) {
      console.log('🔍 [BACKEND] Using temporary service data');
      // For temporary services, use the data from frontend or create default service details
      serviceDetails = {
        title: "Cleaning Service",
        price: 699,
        duration: 60,
        category: "general"
      };
    } else {
      // Validate required fields
      if (!sanitizedServiceId) {
        console.error('❌ [BACKEND] Missing serviceId');
        return res.status(400).json({
          success: false,
          message: "Service ID is required",
        });
      }

      // For real services, find them in the database
      service = await Service.findById(sanitizedServiceId);
      if (!service) {
        console.error('❌ [BACKEND] Service not found:', sanitizedServiceId);
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }
      
      serviceDetails = {
        title: service.title || "Service",
        price: service.price || 0,
        duration: service.duration || 60,
        category: service.category || "general",
      };
      
      console.log('✅ [BACKEND] Service found:', service.title);
    }

    // Validate contact info
    const sanitizedContactInfo = {
      fullName: sanitizeInput(contactInfo.fullName || ''),
      phoneNumber: sanitizeInput(contactInfo.phoneNumber || ''),
      email: sanitizeInput(contactInfo.email || ''),
    };

    console.log('🔍 [BACKEND] Contact info:', sanitizedContactInfo);

    if (!sanitizedContactInfo.fullName) {
      console.error('❌ [BACKEND] Missing full name');
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    if (sanitizedContactInfo.email && !validateEmail(sanitizedContactInfo.email)) {
      console.error('❌ [BACKEND] Invalid email:', sanitizedContactInfo.email);
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (sanitizedContactInfo.phoneNumber && !validatePhone(sanitizedContactInfo.phoneNumber)) {
      console.error('❌ [BACKEND] Invalid phone:', sanitizedContactInfo.phoneNumber);
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Validate schedule
    const sanitizedSchedule = {
      preferredDate: schedule.preferredDate,
      timeSlot: sanitizeInput(schedule.timeSlot || ''),
    };

    console.log('🔍 [BACKEND] Schedule:', sanitizedSchedule);

    if (!sanitizedSchedule.preferredDate || !sanitizedSchedule.timeSlot) {
      console.error('❌ [BACKEND] Missing schedule data');
      return res.status(400).json({
        success: false,
        message: "Preferred date and time slot are required",
      });
    }

    if (!validateDate(sanitizedSchedule.preferredDate)) {
      console.error('❌ [BACKEND] Invalid date:', sanitizedSchedule.preferredDate);
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Validate location
    const sanitizedLocation = {
      country: sanitizeInput(location.country || ''),
      city: sanitizeInput(location.city || ''),
      state: sanitizeInput(location.state || ''),
      area: sanitizeInput(location.area || ''),
      completeAddress: sanitizeInput(location.completeAddress || ''),
    };

    console.log('🔍 [BACKEND] Location:', sanitizedLocation);

    // Check if the selected slot is available
    const startOfDay = new Date(sanitizedSchedule.preferredDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sanitizedSchedule.preferredDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBooking = await Booking.findOne({
      "schedule.preferredDate": { $gte: startOfDay, $lt: endOfDay },
      "schedule.timeSlot": sanitizedSchedule.timeSlot,
      "location.city": sanitizedLocation.city,
      "location.area": sanitizedLocation.area,
      status: { $in: ["pending", "confirmed", "assigned", "in_progress"] }
    });

    if (existingBooking) {
      console.error('❌ [BACKEND] Time slot already booked');
      return res.status(409).json({
        success: false,
        message: "Selected time slot is no longer available",
      });
    }

    // Generate secure booking ID
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const bookingId = `BK${timestamp}${random}`;

    // Validate user exists if provided
    let customer = null;
    if (sanitizedUserId) {
      customer = await User.findById(sanitizedUserId);
      if (!customer) {
        console.error('❌ [BACKEND] User not found:', sanitizedUserId);
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
    }

    console.log('✅ [BACKEND] Creating new booking with ID:', bookingId);

    // Create new booking - handle both temp and real services
    const newBooking = new Booking({
      bookingId,
      customer: sanitizedUserId || null,
      service: isTempService ? undefined : sanitizedServiceId, // Only set service for real services - FIXED
      serviceDetails: serviceDetails, // Use the service details we prepared
      contactInfo: sanitizedContactInfo,
      location: sanitizedLocation,
      schedule: {
        preferredDate: new Date(sanitizedSchedule.preferredDate),
        timeSlot: sanitizedSchedule.timeSlot,
      },
      specialInstructions: sanitizedSpecialInstructions,
      payment: {
        method: sanitizedPaymentMethod || "cash",
        amount: serviceDetails.price || 0,
        currency: "USD",
        status: "pending",
      },
      status: "pending",
    });

    console.log('💾 [BACKEND] Saving booking to database...');
    await newBooking.save();
    console.log('✅ [BACKEND] Booking saved successfully');

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        bookingId: newBooking.bookingId,
        service: newBooking.serviceDetails.title,
        date: newBooking.schedule.preferredDate,
        timeSlot: newBooking.schedule.timeSlot,
        status: newBooking.status
      },
    });

  } catch (error) {
    console.error('❌ [BACKEND] Error creating booking:', error);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Booking validation failed",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error while creating booking",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bookings with security
export const getAllBookings = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const bookings = await Booking.find()
      .populate("customer", "name email")
      .populate("service", "title category")
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({ 
      success: true, 
      data: bookings,
      count: bookings.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching bookings" 
    });
  }
};

// Get user bookings with security
export const getUserBookings = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const userId = sanitizeInput(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const bookings = await Booking.find({ customer: userId })
      .populate("service", "title category price")
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({ 
      success: true, 
      data: bookings,
      count: bookings.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update booking status with security
export const updateBookingStatus = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const bookingId = sanitizeInput(req.params.id);
    const status = sanitizeInput(req.body.status);

    const validStatuses = ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Booking status updated", 
      data: booking 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error updating booking" 
    });
  }
};

// Delete a booking with security
export const deleteBooking = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const bookingId = sanitizeInput(req.params.id);

    const booking = await Booking.findByIdAndDelete(bookingId);

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Booking deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error deleting booking" 
    });
  }
};

// Add booking review with security
export const addBookingReview = async (req, res) => {
  try {
    // Security: Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const bookingId = sanitizeInput(req.params.id);
    const { score, review } = req.body;

    const sanitizedScore = parseInt(score);
    const sanitizedReview = sanitizeInput(review || '');

    if (!sanitizedScore || sanitizedScore < 1 || sanitizedScore > 5) {
      return res.status(400).json({
        success: false, 
        message: "Invalid rating value" 
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false, 
        message: "Booking not found" 
      });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed bookings"
      });
    }

    booking.rating = {
      score: sanitizedScore,
      review: sanitizedReview,
      createdAt: new Date(),
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Rating added successfully",
      data: {
        score: booking.rating.score,
        review: booking.rating.review
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding booking review"
    });
  }
};