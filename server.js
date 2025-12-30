const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");



const app = express();
connectDB();

app.use(cors());
app.use(express.json());



app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/admin", adminRoutes);



app.get("/", (_, res) => {
  res.json({ status: "CallSync Backend Running" });
});

const mongoose = require('mongoose');

// stream file by id: /files/:id
app.get('/files/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'recordings' });
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      res.sendStatus(404);
    });
    res.setHeader('Content-Disposition', 'attachment; filename="recording.mp3"');
    downloadStream.pipe(res);
  } catch (err) {
    console.error('files route error:', err);
    res.sendStatus(400);
  }
});

app.listen(5000, () => {
  console.log("🚀 CallSync Backend running on port 5000");
});
