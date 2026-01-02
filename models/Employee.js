const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // =========================
    // CORE (DO NOT TOUCH)
    // =========================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
    },

    activated: {
      type: Boolean,
      default: false,
    },


    registrationCompleted: {
    type: Boolean,
    default: false
    },


    email: {
      type: String,
      lowercase: true,
      sparse: true,
    },

    password: {
      type: String,
    },

    phoneNumber: {
      type: String,
    },

    tempCode: String,
    tempCodeExpires: Date,

    // =========================
    // ADMIN / WEBSITE ONLY
    // =========================


    documentsUploaded: {
      type: Boolean,
      default: false
    },

    documents: {
      idProofFileId: mongoose.Schema.Types.ObjectId,
      photoFileId: mongoose.Schema.Types.ObjectId
    },  


    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    employeeInternalId: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false, // soft delete (important later)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
