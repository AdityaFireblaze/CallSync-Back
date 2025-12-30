const Employee = require("../models/Employee");
const generateEmployeeCode = require("../utils/generateCode");

// Admin: Create a new employee with a permanent, immutable code
exports.createEmployee = async (req, res) => {
  try {
    const { name, department, phoneNumber } = req.body;

    if (!name || !department || !phoneNumber) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await Employee.findOne({ phoneNumber });
    if (existing) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // Ensure generated code is unique
    let code;
    do {
      code = generateEmployeeCode("CS");
    } while (await Employee.exists({ code }));

    const employee = await Employee.create({
      name,
      department,
      phoneNumber,
      code,
    });

    // Return the created employee including the permanent code (admin only)
    res.status(201).json({ success: true, employee });
  } catch (err) {
    console.error("createEmployee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: Activate an employee (sets activated flag and timestamp)
exports.activateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    employee.activated = true;
    employee.activatedAt = new Date();
    await employee.save();

    res.json({ success: true, message: "Employee activated", employee });
  } catch (err) {
    console.error("activateEmployee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
