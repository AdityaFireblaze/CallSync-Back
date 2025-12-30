const Employee = require("../models/Employee");
const Recording = require("../models/Recording");

exports.uploadRecording = async (req, res) => {
  try {
    const {
      employee_code,
      employee_id,
      phone_number,
      call_duration,
      timestamp,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const recording = await Recording.create({
      employee_id,
      employee_code,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_size: req.file.size,
      phone_number,
      call_duration: Number(call_duration) || 0,
      call_timestamp: new Date(Number(timestamp)),
    });

    await Employee.findByIdAndUpdate(employee_id, {
      last_sync: new Date(),
    });

    res.json({
      success: true,
      message: "Recording uploaded successfully",
      recording,
    });
  } catch (err) {
    console.error("❌ uploadRecording:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
