const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Recording = require("../models/Recording");

const router = express.Router();

// GET /files/:id  → stream audio securely
router.get("/files/:id", auth, async (req, res) => {
  try {
    const fileId = req.params.id;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file id" });
    }

    const _id = new mongoose.Types.ObjectId(fileId);

    // ✅ Find recording metadata
    const recording = await Recording.findOne({ file_id: _id });
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    // ✅ Authorization check
    const user = req.user; // from auth middleware

    if (
      user.role !== "admin" &&
      String(recording.employee_id) !== String(user.id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Open GridFS bucket (IMPORTANT: same bucketName!)
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "recordings",
    });

    // ✅ Set headers for audio streaming
    res.set({
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
    });

    // ✅ Stream file
    const downloadStream = bucket.openDownloadStream(_id);

    downloadStream.on("error", () => {
      return res.status(404).json({ message: "File not found in storage" });
    });

    downloadStream.pipe(res);

  } catch (err) {
    console.error("File stream error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
