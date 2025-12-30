const express = require("express");
const router = express.Router();

const {
  createEmployee,
  listEmployees,
  dashboardStats,
  activateEmployee, // ✅ ADD THIS
} = require("../controllers/adminController");

router.post("/create-employee", createEmployee);
router.get("/employees", listEmployees);
router.get("/stats", dashboardStats);

// ✅ NEW ROUTE
router.put("/activate-employee/:id", activateEmployee);

module.exports = router;
