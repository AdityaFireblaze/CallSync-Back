const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  file_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  file_name: { type: String },
  file_size: { type: Number },
  file_url: { type: String },
  phone_number: { type: String },
  call_duration: { type: Number },
  call_timestamp: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Recording', recordingSchema);
