const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./db');
const Employee = require('./models/Employee');
const Recording = require('./models/Recording');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// MIDDLEWARE
// ======================
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// ======================
// UPLOAD DIRECTORIES
// ======================
const uploadDir = './uploads';
const recordingsDir = './uploads/recordings';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

// ======================
// MULTER CONFIG
// ======================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, recordingsDir),
  filename: (req, file, cb) => {
    const employeeCode = req.body.employee_code || 'unknown';
    const timestamp = Date.now();
    cb(null, `${employeeCode}_${timestamp}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// ======================
// ROUTES
// ======================

// Health check
app.get('/', (_, res) => {
  res.json({
    status: 'CallSync Backend Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ======================
// VALIDATE EMPLOYEE CODE
// ======================
app.post('/api/validate-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const employee = await Employee.findOne({
      code: code.toUpperCase(),
      is_active: true
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive employee code'
      });
    }

    employee.last_sync = new Date();
    await employee.save();

    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        code: employee.code,
        department: employee.department
      }
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ======================
// UPLOAD RECORDING
// ======================
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    const { employee_code, employee_id, phone_number, call_duration, timestamp } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const recording = await Recording.create({
      employee_id,
      employee_code,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_size: req.file.size,
      phone_number,
      call_duration: Number(call_duration) || 0,
      call_timestamp: new Date(Number(timestamp)),
    });

    await Employee.findByIdAndUpdate(employee_id, {
      last_sync: new Date()
    });

    res.json({
      success: true,
      message: 'Recording uploaded successfully',
      recording: {
        id: recording._id,
        fileName: recording.file_name,
        size: recording.file_size
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ======================
// START SERVER
// ======================
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 CallSync Backend Started');
  console.log('🚀 Port:', PORT);
  console.log('🚀 Database: MongoDB');
  console.log('🚀 Uploads:', path.resolve(recordingsDir));
});
