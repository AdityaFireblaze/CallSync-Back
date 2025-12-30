const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadRecording } = require("../controllers/uploadController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/recordings",
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

router.post("/upload", upload.single("audio"), uploadRecording);

module.exports = router;
