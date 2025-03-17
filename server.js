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

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route to get all students
app.get("/get-students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

// Route to get a single student by ID
app.get("/get-student/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Failed to fetch student" });
  }
});

// Route to delete a student
app.delete("/delete-student/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    // Delete the image file if it exists
    if (student && student.image) {
      const imagePath = path.join(__dirname, student.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    const result = await Student.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

// Route to update a student
app.put("/update-student/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, studentId, email, course, year } = req.body;
    const updateData = { name, studentId, email, course, year };
    
    // If there's a new image
    if (req.file) {
      // Get the old image to delete it
      const oldStudent = await Student.findById(req.params.id);
      if (oldStudent && oldStudent.image) {
        const oldImagePath = path.join(__dirname, oldStudent.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json({ message: "Student updated successfully", student: updatedStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Failed to update student" });
  }
});



// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, studentId } = req.body;
  // Convert the provided student ID to a safe format (replace '/' with '_')
 //const safeStudentId = studentId.replace(/\//g, "_");
  

  try {
    // Find the student using the safe student ID
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ message: "No student found with this ID. Please check your Student ID." });
    }
    // Validate the email address
    if (student.email !== email) {
      return res.status(401).json({ message: "The email does not match the registered Student ID." });
    }
    // Login successful, return the student data
    res.json({
      message: "Login successful!",
      studentId: student.studentId,
      name: student.name || "Student",
      email: student.email || "N/A"
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login. Please try again." });
  }
});


// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
