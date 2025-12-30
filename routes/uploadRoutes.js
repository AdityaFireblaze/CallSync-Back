const express = require('express');
const multer = require('multer');
const { uploadRecording } = require('../controllers/uploadController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit (adjust)
});

router.post('/upload', upload.single('audio'), uploadRecording);

module.exports = router;