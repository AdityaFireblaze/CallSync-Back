const Employee = require("../models/Employee");
const generateCode = require("../utils/generateCode");

// CREATE EMPLOYEE
exports.createEmployee = async (req, res) => {
  const { name, department } = req.body;

  if (!name) return res.status(400).json({ message: "Name required" });

  let code;
  do {
    code = generateCode();
  } while (await Employee.exists({ code }));

  const employee = await Employee.create({
    name,
    department,
    code,
    activated: false
  });

  res.json({ success: true, employee });
};

// ACTIVATE EMPLOYEE
exports.activateEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { activated: true },
    { new: true }
  );

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ success: true, employee });
};

// LIST EMPLOYEES
exports.listEmployees = async (_, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 });
  res.json({ success: true, employees });
};
