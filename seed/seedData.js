const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Employee = require("../models/Employee");
const Recording = require("../models/Recording");

async function seed() {
  await connectDB();

  console.log("🧹 Clearing old data...");
  await Employee.deleteMany({});
  await Recording.deleteMany({});

  console.log("👤 Creating employees...");

  const employees = await Employee.insertMany([
    {
      name: "Rohan Patil",
      department: "Sales",
      code: "ROH123",
      activated: true,
    },
    {
      name: "Ankit Sharma",
      department: "Support",
      code: "ANK456",
      activated: true,
    },
    {
      name: "Neha Verma",
      department: "HR",
      code: "NEH789",
      activated: true,
    },
    {
      name: "Aditya Adlak",
      department: "HR",
      code: "A1B2C3",
      activated: true,
    },
  ]);

  console.log("📞 Creating recordings...");

  const recordings = [];

  for (let i = 0; i < 20; i++) {
    const emp = employees[i % employees.length];

    recordings.push({
      employee_id: emp._id,
      employee_code: emp.code,
      phone_number: "+91" + Math.floor(9000000000 + Math.random() * 999999999),
      call_duration: Math.floor(Math.random() * 600) + 30, // 30s – 10min
      call_timestamp: new Date(Date.now() - Math.random() * 7 * 86400000),
      file_name: `dummy_call_${i}.mp3`,
      file_path: `/uploads/dummy_call_${i}.mp3`,
      file_size: Math.floor(Math.random() * 5000000) + 100000,
    });
  }

  await Recording.insertMany(recordings);

  console.log("✅ Dummy data inserted successfully");
  process.exit();
}

seed();
