const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  department: {
    type: String,
    required: true
  },

  code: {
    type: String,
    required: true,
    unique: true,      // ✅ DB-level guarantee
    immutable: true    // ✅ Cannot be changed once set
  },

  activated: {
    type: Boolean,
    default: false
  },

  activatedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Employee", employeeSchema);
