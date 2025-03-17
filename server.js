const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5002;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB (Replace <your_mongodb_uri> with your MongoDB URI)
mongoose.connect("mongodb://localhost:27017/mustid", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// Define Student Schema
const StudentSchema = new mongoose.Schema({
    name: String,
    studentId: String,
    email: String,
    course: String,
    year: Number,
    image: String, // URL to stored image
});

const Student = mongoose.model("Student", StudentSchema);

// Multer Configuration for Image Upload
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API to Handle Form Submission
app.post("/add-student", upload.single("image"), async (req, res) => {
    try {
        const { name, studentId, email, course, year } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

        const newStudent = new Student({ name, studentId, email, course, year, image: imagePath });
        await newStudent.save();

        res.status(201).json({ message: "Student added successfully", student: newStudent });
    } catch (error) {
        res.status(500).json({ error: "Error saving student data" });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
