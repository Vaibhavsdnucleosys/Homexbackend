// import mongoose from "mongoose";

// const employeeSchema = new mongoose.Schema({
//     empId: { type: Number, unique: true },
//     empName: String,
//     email: String,
//     countryId: Number,
//     stateId: Number,
//     cityId: Number,
//     areaId: Number,
//     // New fields for profile system
//     phone: String,
//     address: String,
//     joinDate: { type: Date, default: Date.now },
//     bio: String,
//     role: { type: String, default: "Service Technician" },
//     avatar: { type: String, default: "DP" },
//     specialties: [String],
//     certifications: [String],
//     rating: { type: Number, default: 0 },
//     completedJobs: { type: Number, default: 0 },
//     settings: {
//         emailNotifications: { type: Boolean, default: true },
//         smsNotifications: { type: Boolean, default: true },
//         pushNotifications: { type: Boolean, default: false },
//         autoSchedule: { type: Boolean, default: true },
//         shareLocation: { type: Boolean, default: true },
//         showEarnings: { type: Boolean, default: true }
//     },
//     statistics: {
//         totalEarnings: { type: Number, default: 0 },
//         hoursWorked: { type: Number, default: 0 },
//         avgRating: { type: Number, default: 0 },
//         responseRate: { type: Number, default: 98 },
//         completionRate: { type: Number, default: 99 },
//         repeatCustomers: { type: Number, default: 45 }
//     }
// });

// export default mongoose.model("Employee", employeeSchema);

import mongoose from "mongoose";
import AutoIncrement from "mongoose-sequence";

const AutoIncrementPlugin = AutoIncrement(mongoose);

const employeeSchema = new mongoose.Schema({
    empId: { type: Number, unique: true },
    empName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, default: "Employee", required: true },
    
    // Fields for location, matching the frontend form
    countryId: { type: Number, required: true },
    stateId: { type: Number, required: true },
    cityId: { type: Number, required: true },
    areaId: { type: Number, required: true },

    // Fields added to match the frontend component's needs
    earnings: { type: Number, default: 0, required: true },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    
    // Other profile fields from your original schema
    address: String,
    joinDate: { type: Date, default: Date.now },
    bio: String,
    avatar: { type: String, default: "DP" },
    specialties: [String],
    certifications: [String],
    rating: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    settings: {
        emailNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: true },
    },
    statistics: {
        totalEarnings: { type: Number, default: 0 },
        hoursWorked: { type: Number, default: 0 },
    }
});

// This plugin will automatically create and increment the empId
employeeSchema.plugin(AutoIncrementPlugin, { inc_field: 'empId', start_seq: 101 });

export default mongoose.model("Employee", employeeSchema);