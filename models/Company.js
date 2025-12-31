const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, required: true },
    teamSize: { type: String, required: true },
    contactNumber: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
