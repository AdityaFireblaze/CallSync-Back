const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employee_code: String,
  file_name: String,
  file_path: String,
  file_size: Number,
  file_url: String,
  phone_number: String,
  call_duration: Number,
  call_timestamp: Date,
}, { timestamps: true });

module.exports = mongoose.model('Recording', recordingSchema);
