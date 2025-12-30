const express = require('express');
const multer = require('multer');
const { uploadRecording } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/upload - protected, employees can only upload for themselves
router.post('/upload', auth, upload.single('audio'), uploadRecording);

// (Streaming handled at server root /files/:id)

module.exports = router;