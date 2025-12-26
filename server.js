const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Create directories
const uploadDir = './uploads';
const recordingsDir = './uploads/recordings';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordingsDir);
  },
  filename: (req, file, cb) => {
    const employeeCode = req.body.employee_code || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const fileName = `${employeeCode}_${timestamp}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// ============================================================
// API ENDPOINTS
// ============================================================

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'CallSync Backend Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Validate Employee Code (Mobile App)
app.post('/api/validate-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const result = await pool.query(
      'SELECT id, name, code, email, department FROM employees WHERE code = $1 AND is_active = true',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Invalid code attempt: ${code}`);
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive employee code'
      });
    }

    const employee = result.rows[0];

    // Update last sync time
    await pool.query(
      'UPDATE employees SET last_sync = CURRENT_TIMESTAMP WHERE id = $1',
      [employee.id]
    );

    console.log(`✅ Employee validated: ${employee.name} (${employee.code})`);

    res.json({
      success: true,
      employee: {
        id: employee.id,
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

// Upload Recording (Mobile App)
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { employee_code, employee_id, phone_number, call_duration, timestamp } = req.body;

    console.log('✅ ═══════════════════════════════');
    console.log('✅ Recording received!');
    console.log('✅ Employee:', employee_code);
    console.log('✅ File:', req.file.filename);
    console.log('✅ Size:', (req.file.size / 1024).toFixed(2), 'KB');
    console.log('✅ Phone:', phone_number);
    console.log('✅ Duration:', call_duration, 's');
    console.log('✅ ═══════════════════════════════');

    // Save to database
    const result = await pool.query(
      `INSERT INTO recordings 
       (employee_id, employee_code, file_name, file_path, file_size, phone_number, call_duration, call_timestamp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [
        employee_id,
        employee_code,
        req.file.filename,
        req.file.path,
        req.file.size,
        phone_number || 'unknown',
        parseInt(call_duration) || 0,
        new Date(parseInt(timestamp))
      ]
    );

    // Update employee last sync
    await pool.query(
      'UPDATE employees SET last_sync = CURRENT_TIMESTAMP WHERE id = $1',
      [employee_id]
    );

    res.json({
      success: true,
      message: 'Recording uploaded successfully',
      recording: {
        id: result.rows[0].id,
        fileName: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// ADMIN API ENDPOINTS (For Web Dashboard)
// ============================================================

// Get All Employees
app.get('/api/admin/employees', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        COUNT(r.id) as recording_count,
        MAX(r.uploaded_at) as last_recording
      FROM employees e
      LEFT JOIN recordings r ON e.id = r.employee_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    res.json({ success: true, employees: result.rows });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create New Employee
app.post('/api/admin/employees', async (req, res) => {
  try {
    const { name, email, phone, department } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Generate unique code
    const code = generateEmployeeCode();

    const result = await pool.query(
      `INSERT INTO employees (name, code, email, phone, department) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, code, email, phone, department`,
      [name, code, email, phone, department]
    );

    const employee = result.rows[0];

    console.log(`✅ New employee created: ${name} (${code})`);

    res.json({
      success: true,
      employee
    });

  } catch (error) {
    console.error('❌ Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Employee
app.put('/api/admin/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, is_active } = req.body;

    const result = await pool.query(
      `UPDATE employees 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           department = COALESCE($4, department),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name, email, phone, department, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, employee: result.rows[0] });

  } catch (error) {
    console.error('❌ Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Employee
app.delete('/api/admin/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated recordings first (if not using CASCADE)
    await pool.query('DELETE FROM recordings WHERE employee_id = $1', [id]);
    
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Employee Details with Recordings
app.get('/api/admin/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employeeResult = await pool.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const recordingsResult = await pool.query(
      `SELECT * FROM recordings 
       WHERE employee_id = $1 
       ORDER BY call_timestamp DESC 
       LIMIT 100`,
      [id]
    );

    res.json({
      success: true,
      employee: employeeResult.rows[0],
      recordings: recordingsResult.rows
    });

  } catch (error) {
    console.error('❌ Error fetching employee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get All Recordings (with pagination and filters)
app.get('/api/admin/recordings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const employeeId = req.query.employee_id;
    const search = req.query.search;

    let query = `
      SELECT 
        r.*,
        e.name as employee_name,
        e.code as employee_code,
        e.department as employee_department
      FROM recordings r
      JOIN employees e ON r.employee_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (employeeId) {
      query += ` AND r.employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (e.name ILIKE $${paramIndex} OR r.phone_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY r.call_timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const recordings = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM recordings r JOIN employees e ON r.employee_id = e.id WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (employeeId) {
      countQuery += ` AND r.employee_id = $${countParamIndex}`;
      countParams.push(employeeId);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (e.name ILIKE $${countParamIndex} OR r.phone_number ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const totalResult = await pool.query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].count);

    res.json({
      success: true,
      recordings: recordings.rows,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error('❌ Error fetching recordings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download Recording
app.get('/api/admin/recordings/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_name, file_path FROM recordings WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    const recording = result.rows[0];
    res.download(recording.file_path, recording.file_name);

  } catch (error) {
    console.error('❌ Error downloading recording:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Stream Recording (for web player)
app.get('/api/admin/recordings/:id/stream', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_path FROM recordings WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    const recording = result.rows[0];
    const stat = fs.statSync(recording.file_path);

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size
    });

    const readStream = fs.createReadStream(recording.file_path);
    readStream.pipe(res);

  } catch (error) {
    console.error('❌ Error streaming recording:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Recording
app.delete('/api/admin/recordings/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_path FROM recordings WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    // Delete file from disk
    const filePath = result.rows[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query('DELETE FROM recordings WHERE id = $1', [req.params.id]);

    res.json({ success: true, message: 'Recording deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting recording:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Dashboard Statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalEmployees = await pool.query(
      'SELECT COUNT(*) FROM employees WHERE is_active = true'
    );

    const totalRecordings = await pool.query('SELECT COUNT(*) FROM recordings');

    const todayRecordings = await pool.query(
      'SELECT COUNT(*) FROM recordings WHERE DATE(uploaded_at) = CURRENT_DATE'
    );

    const recentRecordings = await pool.query(`
      SELECT 
        r.*,
        e.name as employee_name,
        e.code as employee_code
      FROM recordings r
      JOIN employees e ON r.employee_id = e.id
      ORDER BY r.uploaded_at DESC
      LIMIT 10
    `);

    const topEmployees = await pool.query(`
      SELECT 
        e.name,
        e.code,
        COUNT(r.id) as recording_count
      FROM employees e
      LEFT JOIN recordings r ON e.id = r.employee_id
      WHERE e.is_active = true
      GROUP BY e.id, e.name, e.code
      ORDER BY recording_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalEmployees: parseInt(totalEmployees.rows[0].count),
        totalRecordings: parseInt(totalRecordings.rows[0].count),
        todayRecordings: parseInt(todayRecordings.rows[0].count),
        recentRecordings: recentRecordings.rows,
        topEmployees: topEmployees.rows
      }
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateEmployeeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ═══════════════════════════════');
  console.log('🚀 CallSync Backend Started');
  console.log('🚀 Port:', PORT);
  console.log('🚀 Database: PostgreSQL');
  console.log('🚀 Uploads:', path.resolve(recordingsDir));
  console.log('🚀 ═══════════════════════════════');
});