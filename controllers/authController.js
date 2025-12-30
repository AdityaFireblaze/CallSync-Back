const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// POST /api/auth/login
// Body depends on your client (kept as-is for now)
exports.login = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, message: 'phoneNumber and code are required' });
    }

    const employee = await Employee.findOne({ phoneNumber, code, activated: true });
    if (!employee) return res.status(401).json({ success: false, message: 'Invalid credentials or not activated' });

    const payload = {
      id: employee._id,
      phoneNumber: employee.phoneNumber,
      code: employee.code,
      role: 'employee',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, token, employee });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/send-code
// Protected: requires `auth` middleware. If caller is admin and provides `employeeId`, send code to that employee.
exports.sendCode = async (req, res) => {
  try {
    const caller = req.user || {};
    const { employeeId } = req.body || {};

    let employee;
    if (caller.role === 'admin' && employeeId) {
      employee = await Employee.findById(employeeId);
    } else if (caller.id) {
      employee = await Employee.findById(caller.id);
    }

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Generate a short one-time numeric code (for delivery), but the permanent `employee.code` also exists.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    employee.tempCode = otp;
    employee.tempCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await employee.save();

    // TODO: integrate SMS/Email provider here (Twilio, SendGrid, etc.)
    console.log(`send-code: sending OTP ${otp} to ${employee.phoneNumber} (employee ${employee._id})`);

    res.json({ success: true, message: 'Activation code sent' });
  } catch (err) {
    console.error('sendCode error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/validate-code
// Body: { code }
// Accepts either the permanent `employee.code` or the one-time `tempCode`.
exports.validateCode = async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ success: false, message: 'code is required' });

    // First try to match permanent code
    let employee = await Employee.findOne({ code: code.trim().toUpperCase() });

    // If not found, try matching tempCode and ensure not expired
    if (!employee) {
      employee = await Employee.findOne({ tempCode: code.trim() });
      if (employee && employee.tempCodeExpires && employee.tempCodeExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'Code expired' });
      }
    }

    if (!employee) return res.status(404).json({ success: false, message: 'Invalid code' });

    if (!employee.activated) return res.status(403).json({ success: false, message: 'Employee not activated' });

    // Clear tempCode after successful validation
    employee.tempCode = undefined;
    employee.tempCodeExpires = undefined;
    await employee.save();

    // return employee object (frontend expects `employee.code`, `employee.name`, and `employee.id/_id`)
    res.json({ success: true, employee });
  } catch (err) {
    console.error('validateCode error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
