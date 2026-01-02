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

  firstName,
  lastName,

  phoneNumber,
  department,
  designation,
  employeeInternalId,
  joiningDate,

  code: employeeCode,

  activated: false,                 // mobile activation later
  registrationCompleted: false,     // ⬅️ IMPORTANT (admin review pending)

  documentsUploaded: false,         // ⬅️ explicit
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



exports.completeEmployeeRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find employee
    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // 2️⃣ Ensure documents uploaded
    if (!employee.documentsUploaded) {
      return res.status(400).json({
        message: "Employee documents not uploaded"
      });
    }

    // 3️⃣ Prevent double registration
    if (employee.registrationCompleted) {
      return res.status(400).json({
        message: "Employee already registered"
      });
    }

    // 4️⃣ FINAL APPROVAL
    employee.registrationCompleted = true;
    employee.activated = true;

    await employee.save();

    // 5️⃣ Response
    res.json({
      success: true,
      message: "Employee registration completed",
      employee: {
        id: employee._id,
        name: employee.name,
        code: employee.code,
        activated: employee.activated,
        registrationCompleted: employee.registrationCompleted
      }
    });

  } catch (err) {
    console.error("completeEmployeeRegistration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

