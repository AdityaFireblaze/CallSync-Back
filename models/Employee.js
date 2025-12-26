const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  email: String,
  phone: String,
  department: String,
  is_active: { type: Boolean, default: true },
  last_sync: Date,
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
