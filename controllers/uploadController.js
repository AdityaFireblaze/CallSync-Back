const path = require('path');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Recording = require('../models/Recording');

function uploadToGridFS(buffer, filename, metadata = {}) {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'recordings' });

    const uploadStream = bucket.openUploadStream(filename, { metadata });
    uploadStream.end(buffer);

    uploadStream.on('finish', () => {
      resolve({
        _id: uploadStream.id,
        filename: uploadStream.filename,
        length: uploadStream.length || buffer.length,
      });
    });

    uploadStream.on('error', (err) => reject(err));
  });
}

// Protected endpoint: requires `middleware/auth.js` to set req.user
exports.uploadRecording = async (req, res) => {
  try {
    const uploader = req.user; // { id, phoneNumber, code }

    const {
      employee_code,
      employee_id,
      phone_number,
      call_duration,
      timestamp,
    } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    if (!employee_id || !employee_code) return res.status(400).json({ success: false, message: 'Employee ID and code are required' });

    // Only allow employee to upload for themselves
    if (uploader.role !== 'admin' && String(uploader.id) !== String(employee_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot upload for another employee' });
    }

    const employee = await Employee.findById(employee_id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // upload to GridFS
    const filename = `${Date.now()}${path.extname(req.file.originalname) || '.mp3'}`;
    const metadata = {
      employee_id,
      employee_code,
      phone_number,
      originalName: req.file.originalname,
    };

    const file = await uploadToGridFS(req.file.buffer, filename, metadata);

    const fileUrl = `${req.protocol}://${req.get('host')}/files/${file._id}`;

    const recording = await Recording.create({
      employee_id,
      employee_code,
      file_id: file._id,
      file_name: file.filename,
      file_size: file.length,
      file_url: fileUrl,
      phone_number: phone_number || 'unknown',
      call_duration: Number(call_duration) || 0,
      call_timestamp: timestamp ? new Date(Number(timestamp)) : new Date(),
    });

    res.status(201).json({ success: true, message: 'Recording uploaded', recording });
  } catch (err) {
    console.error('uploadRecording error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};