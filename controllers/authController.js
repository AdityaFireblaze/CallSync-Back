const Employee = require("../models/Employee");

const validateCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required",
      });
    }

    const employee = await Employee.findOne({
      code: code.toUpperCase(),
      activated: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive employee code",
      });
    }

    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        code: employee.code,
        department: employee.department,
      },
    });
  } catch (err) {
    console.error("Validate code error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  validateCode,   // ✅ THIS IS CRITICAL
};
