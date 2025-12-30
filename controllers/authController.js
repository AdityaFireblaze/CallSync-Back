const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateEmployeeCode = require('../utils/generateCode');
const Employee = require('../models/Employee');
const sendNotification = require('../utils/notify');

// POST /api/auth/login
// Body depends on your client (kept as-is for now)
// POST /api/auth/login
// Body: { email, password }
// On success: issue token and send one-time activation code (tempCode)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'email and password are required' });

    const employee = await Employee.findOne({ email: email.trim().toLowerCase() });
    if (!employee) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!employee.password) return res.status(401).json({ success: false, message: 'Account has no password set' });

    const match = await bcrypt.compare(password, employee.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!employee.activated) return res.status(403).json({ success: false, message: 'Account not activated' });

    const payload = {
      id: employee._id,
      email: employee.email,
      role: 'employee',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    // generate and persist a one-time activation code (OTP)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    employee.tempCode = otp;
    employee.tempCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await employee.save();

    // Send via configured provider (Twilio SMS preferred, else SendGrid email).
    const message = `Your CallSync activation code is: ${otp}`;
    try {
      await sendNotification({ toPhone: employee.phoneNumber, toEmail: employee.email, subject: 'CallSync code', text: message });
    } catch (err) {
      console.error('notification error on login:', err);
    }

    res.json({ success: true, token, employee, message: 'OTP sent' });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/register
// Body: { name, email, password, phoneNumber }
exports.register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body || {};
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'name, email, password and phoneNumber are required' });
    }

    const existing = await Employee.findOne({ $or: [{ email: email.trim().toLowerCase() }, { phoneNumber }] });
    if (existing) return res.status(400).json({ success: false, message: 'Account with email or phone already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // ensure unique permanent code
    let code;
    do {
      code = generateEmployeeCode('CS');
    } while (await Employee.exists({ code }));

    const employee = await Employee.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashed,
      phoneNumber,
      code,
      activated: true // allow immediate activation; change if admin must approve
    });

    res.status(201).json({ success: true, employee });
  } catch (err) {
    console.error('register error:', err);
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

    // Generate a short one-time numeric code (for delivery).
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    employee.tempCode = otp;
    employee.tempCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await employee.save();

    const message = `Your CallSync activation code is: ${otp}`;
    try {
      await sendNotification({ toPhone: employee.phoneNumber, toEmail: employee.email, subject: 'CallSync code', text: message });
    } catch (err) {
      console.error('notification error on sendCode:', err);
    }

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
