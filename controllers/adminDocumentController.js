// controllers/adminDocumentController.js
const Employee = require("../models/Employee");
const uploadToGridFS = require("../utils/uploadToGridFS");

exports.uploadEmployeeDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!req.files?.idProof || !req.files?.photo) {
      return res.status(400).json({
        message: "ID proof and photo are required"
      });
    }

    const idProofFileId = await uploadToGridFS(
      req.files.idProof[0].buffer,
      req.files.idProof[0].originalname,
      { employeeId: id, type: "idProof" }
    );

    const photoFileId = await uploadToGridFS(
      req.files.photo[0].buffer,
      req.files.photo[0].originalname,
      { employeeId: id, type: "photo" }
    );

    employee.documents = {
      idProofFileId,
      photoFileId
    };
    employee.documentsUploaded = true;

    await employee.save();

    res.json({
      success: true,
      message: "Documents uploaded successfully"
    });

  } catch (err) {
    console.error("Document upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
