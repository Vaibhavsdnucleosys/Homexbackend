import Booking from "../models/Booking.js";
import User from "../models/User.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { userId, service, date, time } = req.body;

    if (!userId || !service || !date || !time) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const booking = new Booking({ user: userId, service, date, time });
    await booking.save();

    res.status(201).json({ msg: "Booking created", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get all bookings (Admin/Employee can use this)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user", "name email role");
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get bookings for a single user
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ user: userId });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update booking status (Admin/Employee)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    res.json({ msg: "Booking status updated", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    res.json({ msg: "Booking deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
