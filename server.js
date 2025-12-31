require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fileRoutes = require("./routes/fileRoutes");
const adminEmployeeRoutes = require("./routes/adminEmployeeRoutes");
const adminDocumentRoutes = require("./routes/adminDocumentRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");





const app = express();

// connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// health
app.get('/', (_, res) => res.json({ status: 'CallSync Backend Running' }));

// API routes
app.use('/api', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use(fileRoutes);
app.use("/api/admin", adminEmployeeRoutes);
app.use("/api", adminDocumentRoutes);
app.use("/api/admin/auth", adminAuthRoutes);




// Stream file by id at root path: GET /files/:id (protected)
const auth = require('./middleware/auth');
const mongoose = require('mongoose');
const Recording = require('./models/Recording');

app.get('/files/:id', auth, async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId) return res.status(400).json({ message: 'File id required' });

    const recording = await Recording.findOne({ file_id: mongoose.Types.ObjectId(fileId) });
    if (!recording) return res.status(404).json({ message: 'Recording not found' });

    const requester = req.user || {};
    if (requester.role !== 'admin' && String(requester.id) !== String(recording.employee_id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'recordings' });
    const _id = new mongoose.Types.ObjectId(fileId);
    const downloadStream = bucket.openDownloadStream(_id);

    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      res.sendStatus(404);
    });

    res.setHeader('Content-Disposition', `attachment; filename="${recording.file_name || 'recording.mp3'}"`);
    downloadStream.pipe(res);
  } catch (err) {
    console.error('files route error:', err);
    res.sendStatus(400);
  }
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CallSync Backend running on port ${PORT}`));
