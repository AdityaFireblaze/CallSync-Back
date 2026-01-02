const express = require("express");
const {
  createEmployee,
  completeEmployeeRegistration
} = require("../controllers/adminEmployeeController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// 🔐 Create employee (Admin only)
router.post(
  "/employees",
  adminAuth,
  createEmployee
);

// 🔐 Complete registration (Admin only)
router.patch(
  "/employees/:id/complete-registration",
  adminAuth,
  completeEmployeeRegistration
);

module.exports = router;
