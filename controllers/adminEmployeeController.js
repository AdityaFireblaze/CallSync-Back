const Employee = require("../models/Employee");
const generateEmployeeCode = require("../utils/generateCode");

exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      department,
      designation,
      employeeInternalId,
      joiningDate,
    } = req.body;

    // ✅ basic validation
    if (!firstName || !phoneNumber || !department) {
      return res.status(400).json({
        message: "firstName, phoneNumber and department are required",
      });
    }

    // ❌ prevent duplicate phone
    const existing = await Employee.findOne({ phoneNumber });
    if (existing) {
      return res.status(400).json({
        message: "Employee already exists with this phone number",
      });
    }

    // ✅ generate permanent employee code
    const employeeCode = generateEmployeeCode();

    const employee = await Employee.create({
      name: `${firstName} ${lastName || ""}`.trim(),
      phoneNumber,
      department,
      designation,
      employeeInternalId,
      joiningDate,
      code: employeeCode,
      activated: false, // 🔴 IMPORTANT
      email: null,
      password: null,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        department: employee.department,
        code: employee.code,
        activated: employee.activated,
      },
    });

  } catch (err) {
    console.error("createEmployee error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
