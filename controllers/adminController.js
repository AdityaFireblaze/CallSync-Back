const Employee = require("../models/Employee");

// ==========================
// CREATE EMPLOYEE
// ==========================
exports.createEmployee = async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Employee name is required",
      });
    }

    // Generate UNIQUE code
    const generateCode = require("../utils/generateCode");
    let code;
    let exists = true;

    while (exists) {
      code = generateCode();
      const check = await Employee.findOne({ code });
      if (!check) exists = false;
    }

    const employee = await Employee.create({
      name,
      department,
      code,
      activated: false, // 🔴 IMPORTANT
    });

    res.json({ success: true, employee });
  } catch (err) {
    console.error("❌ Create employee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// ACTIVATE EMPLOYEE ✅
// ==========================
exports.activateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { activated: true },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({ success: true, employee });
  } catch (err) {
    console.error("❌ Activate employee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// LIST EMPLOYEES
// ==========================
exports.listEmployees = async (_, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 });
  res.json({ success: true, employees });
};

// ==========================
// DASHBOARD STATS
// ==========================
exports.dashboardStats = async (_, res) => {
  const totalEmployees = await Employee.countDocuments();
  const activeEmployees = await Employee.countDocuments({ activated: true });

  res.json({
    success: true,
    stats: {
      totalEmployees,
      activeEmployees,
    },
  });
};
