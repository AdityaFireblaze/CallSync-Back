// routes/adminDocumentRoutes.js
const express = require("express");
const auth = require("../middleware/auth");
const uploadDocs = require("../middleware/uploadDocs");
const { uploadEmployeeDocuments } = require("../controllers/adminDocumentController");

const router = express.Router();

// Admin only
router.post(
  "/admin/employees/:id/documents",
  auth,
  uploadDocs.fields([
    { name: "idProof", maxCount: 1 },
    { name: "photo", maxCount: 1 }
  ]),
  uploadEmployeeDocuments
);

module.exports = router;
