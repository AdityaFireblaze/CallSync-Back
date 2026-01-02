const express = require("express");
const {
  createEmployee,
  completeEmployeeRegistration,
  getAllEmployees,
} = require("../controllers/adminEmployeeController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// 🔐 Get all employees (Admin only)
router.get(
  "/allEmployees",
  adminAuth,
  getAllEmployees
);

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
