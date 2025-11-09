// import User from "../models/User.js"; 
// import jwt from "jsonwebtoken";

// // Signup with role limits
// export const signup = async (req, res) => {
//   const { name, email, password, role } = req.body;

//   try {
//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ msg: "User already exists" });

//     // Role limits
//     if (role === "admin") {
//       const admins = await User.countDocuments({ role: "admin" });
//       if (admins >= 1)
//         return res.status(400).json({ msg: "Admin limit reached (max 1)" });
//     } else if (role === "employee") {
//       const employees = await User.countDocuments({ role: "employee" });
//       if (employees >= 10)
//         return res
//           .status(400)
//           .json({ msg: "Employee limit reached (max 10)" });
//     }

//     user = new User({ name, email, password, role });
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.json({ token, role: user.role, msg: "Signup successful" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };

// // Login
// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: "Invalid credentials" });

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch)
//       return res.status(400).json({ msg: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.json({ token, role: user.role, msg: "Login successful" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };

// export default { signup, login };


// C:\Users\sanke\Downloads\Homax\Backend\controllers\authController.js
import User from "../models/User.js"; 
import jwt from "jsonwebtoken";

// Signup
export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // Role limits
    if (role === "admin") {
      const admins = await User.countDocuments({ role: "admin" });
      if (admins >= 1)
        return res.status(400).json({ msg: "Admin limit reached (max 1)" });
    } else if (role === "employee") {
      const employees = await User.countDocuments({ role: "employee" });
      if (employees >= 10)
        return res
          .status(400)
          .json({ msg: "Employee limit reached (max 10)" });
    }

    user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token, role: user.role, msg: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token, role: user.role, msg: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};