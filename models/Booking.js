import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false,  // ← CHANGED FROM true TO false
    index: true
  },
  serviceDetails: {
    title: {
      type: String,
      required: [true, 'Service title is required']
    },
    price: {
      type: Number,
      required: [true, 'Service price is required']
    },
    duration: Number,
    category: String
  },
  contactInfo: {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      index: true
    }
  },
  location: {
    country: {
      type: String,
      required: [true, 'Country is required'],
      index: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      index: true
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      index: true
    },
    completeAddress: {
      type: String,
      required: [true, 'Complete address is required']
    }
  },
  schedule: {
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
      index: true
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      index: true
    }
  },
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  payment: {
    method: {
      type: String,
      enum: ['online', 'cash', 'card', 'upi'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    transactionId: String,
    stripePaymentIntentId: String,
    paymentDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  cancellationReason: String,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// ✅ Auto-generate Booking ID on creation
bookingSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookingId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingId = `BK${timestamp}${random}`;
  }
  next();
});

// ✅ Compound Indexes for Fast Queries
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1, 'schedule.preferredDate': 1 });
bookingSchema.index({ 'schedule.preferredDate': 1, 'schedule.timeSlot': 1 });
bookingSchema.index({ 'location.city': 1, 'location.area': 1 });

// ✅ Prevent OverwriteModelError in development (Hot Reload Safe)
export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);