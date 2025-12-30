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

  phoneNumber: {
    type: String,
    required: true,
    unique: true        // one phone → one employee
  },

  code: {
    type: String,
    required: true,
    unique: true,
    immutable: true     // permanent pairing code
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
