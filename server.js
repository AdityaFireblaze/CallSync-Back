const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const phoneNumber = req.body.phone_number || 'unknown';
        const ext = path.extname(file.originalname);
        const fileName = `call_${phoneNumber}_${timestamp}${ext}`;
        cb(null, fileName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'CallSync Backend Running',
        timestamp: new Date().toISOString()
    });
});

// Upload endpoint
app.post('/upload', upload.single('audio'), (req, res) => {
    if (!req.file) {
        console.log('❌ No file received');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { phone_number, call_duration, timestamp } = req.body;
    
    console.log('✅ ═══════════════════════════════');
    console.log('✅ Recording received!');
    console.log('✅ File:', req.file.filename);
    console.log('✅ Size:', (req.file.size / 1024).toFixed(2), 'KB');
    console.log('✅ Phone:', phone_number);
    console.log('✅ Duration:', call_duration, 's');
    console.log('✅ Timestamp:', new Date(parseInt(timestamp)).toLocaleString());
    console.log('✅ Saved to:', req.file.path);
    console.log('✅ ═══════════════════════════════');

    res.json({
        success: true,
        message: 'Recording uploaded successfully',
        file: {
            name: req.file.filename,
            size: req.file.size,
            path: req.file.path
        },
        metadata: {
            phone_number,
            call_duration,
            timestamp
        }
    });
});

// List all recordings
app.get('/recordings', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Cannot read uploads directory' });
        }
        
        const recordings = files.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                created: stats.birthtime
            };
        });
        
        res.json({ recordings });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ═══════════════════════════════');
    console.log('🚀 CallSync Backend Started');
    console.log('🚀 Port:', PORT);
    console.log('🚀 Upload directory:', path.resolve(uploadDir));
    console.log('🚀 ═══════════════════════════════');
});