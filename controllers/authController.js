const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateEmployeeCode = require('../utils/generateCode');
const Employee = require('../models/Employee');
const sendEmail = require("../utils/sendEmail");

// const sendNotification = require('../utils/notify');

// POST /api/auth/login
// Body depends on your client (kept as-is for now)
// POST /api/auth/login
// Body: { email, password }
// On success: issue token and send one-time activation code (tempCode)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password required",
      });
    }

    const employee = await Employee.findOne({
      email: email.toLowerCase(),
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const ok = await bcrypt.compare(password, employee.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!employee.activated) {
      return res.status(403).json({
        success: false,
        message: "Employee not activated",
      });
    }

    // ✅ CREATE JWT
    const token = jwt.sign(
      { id: employee._id, role: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // ✅ SEND EMPLOYEE CODE VIA EMAIL (NON-BLOCKING)
    try {
      await sendEmail({
        to: employee.email,
        subject: "Your CallSync Employee Code",
        text: `
Hello ${employee.name},

You have successfully logged in to CallSync.

Your Employee Code:
${employee.code}

Use this code to activate your device in the CallSync app.

Regards,
CallSync Team
        `,
      });
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
      // ❗ DO NOT FAIL LOGIN IF EMAIL FAILS
    }

    // ✅ RESPONSE
    res.json({
      success: true,
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        code: employee.code,
      },
    });

  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// POST /api/auth/register
// Body: { name, email, password, phoneNumber }
exports.register = async (req, res) => {
  try {
    const { email, password, phoneNumber, employeeCode } = req.body;

    if (!email || !password || !phoneNumber || !employeeCode) {
      return res.status(400).json({
        success: false,
        message: "email, password, phoneNumber and employeeCode are required"
      });
    }

    const employee = await Employee.findOne({
      code: employeeCode.trim().toUpperCase()
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Invalid employee code" });
    }

    if (!employee.activated) {
      return res.status(403).json({ success: false, message: "Employee not activated by admin" });
    }

    if (employee.email) {
      return res.status(400).json({ success: false, message: "Employee already registered" });
    }

    employee.email = email.toLowerCase();
    employee.password = await bcrypt.hash(password, 10);
    employee.phoneNumber = phoneNumber;

    await employee.save();

    res.json({ success: true, message: "Registration successful" });

  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// POST /api/auth/send-code
// Protected: requires `auth` middleware. If caller is admin and provides `employeeId`, send code to that employee.
// exports.sendCode = async (req, res) => {
//   try {
//     const caller = req.user || {};
//     const { employeeId } = req.body || {};

//     let employee;
//     if (caller.role === 'admin' && employeeId) {
//       employee = await Employee.findById(employeeId);
//     } else if (caller.id) {
//       employee = await Employee.findById(caller.id);
//     }

//     if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

//     // Generate a short one-time numeric code (for delivery).
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     employee.tempCode = otp;
//     employee.tempCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//     await employee.save();

//     const message = `Your CallSync activation code is: ${otp}`;
//     try {
//       await sendNotification({ toPhone: employee.phoneNumber, toEmail: employee.email, subject: 'CallSync code', text: message });
//     } catch (err) {
//       console.error('notification error on sendCode:', err);
//     }

//     res.json({ success: true, message: 'Activation code sent' });
//   } catch (err) {
//     console.error('sendCode error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// POST /api/validate-code
// Body: { code }
// Accepts either the permanent `employee.code` or the one-time `tempCode`.
exports.validateCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "code required" });

    const employee = await Employee.findOne({
      _id: req.user?.id,
      code: code.trim().toUpperCase()
    });

    if (!employee) {
      return res.status(401).json({ success: false, message: "Invalid employee code" });
    }

    res.json({ success: true, employee });

  } catch (err) {
    console.error("validateCode error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = req.user || {};
    if (!user.id) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const employee = await Employee.findById(user.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = exports;
