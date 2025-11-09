import Employee from "../models/Employee.js";

// GET ALL EMPLOYEES
// NOTE: This aggregation will only work if you have 'countries', 'states', etc. collections and a proper lookup pipeline.
// If it fails, a simpler `const employees = await Employee.find({});` will work without location names.
export const searchEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({}); // Using a simpler find for now to ensure it works.
        // The frontend expects 'id' and 'name', so we map the fields.
        const formattedEmployees = employees.map(emp => ({
            id: emp.empId,
            name: emp.empName,
            email: emp.email,
            phone: emp.phone,
            role: emp.role,
            earnings: emp.earnings,
            status: emp.status,
            avatar: emp.avatar,
            countryId: emp.countryId,
            stateId: emp.stateId,
            cityId: emp.cityId,
            areaId: emp.areaId
            // You can add joined data here later if needed
        }));
        res.json(formattedEmployees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// CREATE NEW EMPLOYEE
export const createEmployee = async (req, res) => {
    try {
        // --- FIX: Destructure the correct keys sent from the frontend ---
        const { name, email, phone, role, earnings, status, countryId, stateId, cityId, areaId } = req.body;
        
        const newEmployee = new Employee({
            empName: name, // Map 'name' from frontend to 'empName' in schema
            email,
            phone,
            role,
            earnings,
            status,
            // --- FIX: Use the correctly destructured variables ---
            countryId,
            stateId,
            cityId,
            areaId,
            // Generate a default avatar from the name
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
        });

        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (err) {
        // This will now give a specific Mongoose validation error if a required field is missing
        res.status(400).json({ error: err.message });
    }
};

// UPDATE EMPLOYEE
export const updateEmployeeProfile = async (req, res) => {
    try {
        // --- FIX: Destructure the correct keys sent from the frontend ---
        const { name, email, phone, role, earnings, status, countryId, stateId, cityId, areaId } = req.body;
        
        const updateData = {
            empName: name,
            email,
            phone,
            role,
            earnings,
            status,
            // --- FIX: Use the correctly destructured variables ---
            countryId,
            stateId,
            cityId,
            areaId,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
        };

        const employee = await Employee.findOneAndUpdate(
            { empId: parseInt(req.params.id) }, // Find by empId
            updateData, 
            { new: true, runValidators: true } // 'new: true' returns the updated doc, 'runValidators' ensures schema rules are met
        );

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        
        res.json(employee);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({ empId: parseInt(req.params.id) });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.json({ message: "Employee deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};