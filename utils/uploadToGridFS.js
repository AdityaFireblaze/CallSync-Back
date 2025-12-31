// utils/uploadToGridFS.js
const mongoose = require("mongoose");

module.exports = function uploadToGridFS(buffer, filename, metadata = {}) {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "employee_docs"
    });

    const uploadStream = bucket.openUploadStream(filename, { metadata });
    uploadStream.end(buffer);

    uploadStream.on("finish", () => {
      resolve(uploadStream.id);
    });

    uploadStream.on("error", reject);
  });
};
