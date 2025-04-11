const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto'); // Imported crypto for encryption
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Enable CORS
app.use(cors());

// Increase the request size limit for Express (for JSON and URL encoded, if needed)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dvujewnzv',
  api_key: '574286298287138',
  api_secret: 'QZdXJJvkw_KIQXkq6u_kY8lgH4Y',
  timeout: 60000 // 60 seconds timeout
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mustid', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB Connection Success');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
});

// ============================================================
// Encryption Functions
// ============================================================
// For demonstrative purposes we are using deterministic encryption
// by using a fixed IV. This allows us to query on encrypted fields,
// but note that using a fixed IV is NOT recommended for high-security
// applications as it weakens encryption randomness.
const algorithm = 'aes-256-cbc';
// Derive a 32-byte key from a passphrase (replace YOUR_SECRET with your secret)
// In production, use environment variables and secure key management.
const secretKey = crypto
.createHash('sha256')
.update(String(process.env.SECRET_KEY))
.digest()
.slice(0, 32);
const fixedIV = Buffer.alloc(16, 0); // 16-byte IV filled with zeros for deterministic encryption

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, fixedIV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, fixedIV);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
// ============================================================

// Define a Student schema and model
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // encrypted
  studentId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  year: { type: Number, required: true },
  image: { type: String, required: true },
  cloudinaryId: { type: String }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

// Set up multer for file handling when needed (for Cloudinary uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

// File filter for multer
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Serve static files if needed (e.g., your client-side assets)
app.use('/uploads', express.static('uploads'));

// Enhanced logging function
function logEvent(type, message, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`, details);
}

/*
  Combined endpoint for adding a new student record.
  Expects a multipart/form-data request containing:
  - Text fields: name, studentId, email, course, year
  - File field: image
*/
app.post('/add-student', upload.single('image'), async (req, res) => {
  try {
    // Ensure the file is present
    if (!req.file) {
      logEvent('error', 'No image uploaded');
      return res.status(400).json({ message: '⚠️ No image uploaded' });
    }

    // Upload file to Cloudinary
    const uploadOptions = {
      folder: 'data_entry_app',
      use_filename: true,
      resource_type: 'auto',
      timeout: 60000
    };
    const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
    
    // Remove the temporary file
    fs.unlinkSync(req.file.path);

    // Get fields from req.body
    const { name, studentId, email, course, year } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('Name');
    if (!studentId) missingFields.push('Student ID');
    if (!email) missingFields.push('Email');
    if (!course) missingFields.push('Course');
    if (!year) missingFields.push('Year');

    if (missingFields.length > 0) {
      logEvent('error', 'Missing required fields', { missingFields });
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }

    // Encrypt sensitive fields before storing them
    const encryptedName = encrypt(name);
    const encryptedStudentId = encrypt(studentId);
    const encryptedEmail = encrypt(email);

    // Create new student record with image URL and Cloudinary ID
    const newStudent = new Student({
      name: encryptedName,
      studentId: encryptedStudentId,
      email: encryptedEmail,
      course,
      year: Number(year),
      image: result.secure_url,
      cloudinaryId: result.public_id
    });

    await newStudent.save();

    logEvent('success', 'Student added successfully', { studentId: newStudent._id });
    
    res.status(201).json({ 
      message: '✅ Student added successfully', 
      student: newStudent 
    });
  } catch (error) {
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      logEvent('error', 'Duplicate entry', { field: duplicateField });
      return res.status(409).json({ 
        message: `❌ ${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists`, 
        error: error.message 
      });
    }
    logEvent('error', 'Error adding student', { error: error.message });
    res.status(500).json({ 
      message: '❌ Error adding student', 
      error: error.message 
    });
  }
});

// Other endpoints remain the same (update, delete, get, etc.)
app.put('/update-student/:id', async (req, res) => {
  try {
    const { name, studentId, email, course, year, image } = req.body;

    const updatedData = { 
      name: name ? encrypt(name) : undefined, 
      studentId: studentId ? encrypt(studentId) : undefined, 
      email: email ? encrypt(email) : undefined, 
      course, 
      year: Number(year), 
      image 
    };

    // Remove properties that are undefined
    Object.keys(updatedData).forEach(key => updatedData[key] === undefined && delete updatedData[key]);
    
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    
    if (!updatedStudent) {
      logEvent('warning', 'Student not found for update', { id: req.params.id });
      return res.status(404).json({ message: '⚠️ Student not found' });
    }

    logEvent('success', 'Student updated successfully', { studentId: updatedStudent._id });
    
    res.json({ 
      message: '✅ Student updated successfully', 
      student: updatedStudent 
    });
  } catch (error) {
    logEvent('error', 'Error updating student', { error: error.message });
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        message: `❌ ${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists`, 
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: '❌ Error updating student', 
      error: error.message 
    });
  }
});

app.delete('/delete-student/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    
    if (!deletedStudent) {
      logEvent('warning', 'Student not found for deletion', { id: req.params.id });
      return res.status(404).json({ message: '⚠️ Student not found' });
    }

    logEvent('success', 'Student deleted successfully', { studentId: deletedStudent._id });
    
    res.json({ 
      message: '✅ Student deleted successfully' 
    });
  } catch (error) {
    logEvent('error', 'Error deleting student', { error: error.message });
    res.status(500).json({ 
      message: '❌ Error deleting student', 
      error: error.message 
    });
  }
});

app.get('/get-students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    logEvent('success', 'Retrieved all students', { count: students.length });
    res.json(students);
  } catch (error) {
    logEvent('error', 'Error fetching students', { error: error.message });
    res.status(500).json({ 
      message: '❌ Error fetching students', 
      error: error.message 
    });
  }
});

app.get('/get-student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      logEvent('warning', 'Student not found', { id: req.params.id });
      return res.status(404).json({ message: '⚠️ Student not found' });
    }
    logEvent('success', 'Retrieved student details', { studentId: student._id });
    res.json(student);
  } catch (error) {
    logEvent('error', 'Error fetching student', { error: error.message });
    res.status(500).json({ 
      message: '❌ Error fetching student', 
      error: error.message 
    });
  }
});

// Add this new endpoint below your other routes
// Login endpoint: Note that we must encrypt input values deterministically to search the database.
app.post('/login', async (req, res) => {
  const { email, studentId } = req.body;

  if (!email || !studentId) {
    return res.status(400).json({ message: 'Email and Student ID are required' });
  }

  try {

    // Encrypt input values to search in the database
    const encryptedEmail = encrypt(email);
    const encryptedStudentId = encrypt(studentId);

    // Find the student by email and studentId
    const student = await Student.findOne({ email: encryptedEmail, studentId: encryptedStudentId });
    
    if (!student) {
      return res.status(401).json({ message: 'Invalid email or student ID' });
    }

    // Successful login - send back the student info
    res.json({
      studentId: decrypt(student.studentId),
      name: decrypt(student.name),
      email: decrypt(student.email),
      image: student.image
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'An error occurred during login',
      error: error.message
    });
  }
});


// Global error handler
app.use((err, req, res, next) => {
  logEvent('critical', 'Unhandled server error', { error: err.message });
  res.status(500).json({ 
    message: '❌ Unexpected server error', 
    error: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
