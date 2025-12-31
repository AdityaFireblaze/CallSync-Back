// middleware/uploadDocs.js
const multer = require("multer");

const storage = multer.memoryStorage();

const uploadDocs = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = uploadDocs;
