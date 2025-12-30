const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    department: {
      type: String,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true
    },

    activated: {
      type: Boolean,
      default: false
    },

    // Filled ONLY after user registration
    email: {
      type: String,
      lowercase: true,
      sparse: true
    },

    password: {
      type: String
    },

    phoneNumber: {
      type: String
    },

    tempCode: String,
    tempCodeExpires: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
