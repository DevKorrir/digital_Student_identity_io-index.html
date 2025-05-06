# DIGITAL STUDENT IDENTIFICATION SYSTEM  (QR CODE BASED) MUSTID

## 📖 Overview

The Smart Student identification System is a full-stack web application designed to streamline the collection,
storage, and retrieval of student data. It enables administrators to efficiently upload student details—including personal
information and photographs—while generating unique QR codes for each student record. The system integrates cloud-based image
storage for optimal performance and ease of maintenance.The system employs Node.js-based RESTful API designed for handling secure 
student identity records. It accepts image uploads, stores student details in MongoDB using Mongoose, and encrypts/decrypts sensitive QR code data 
with Cloudinary integration for image hosting in the cloud.

## 🚀 Features

- **Student Data Management:** 
  - Upload and manage student details such as student ID, full name, email, department, and StudentId Image.
  - Generate unique QR codes for each student record.
- **RESTful API:** 
  - Built using Node.js and Express.js, offering robust CRUD operations.
- **Cloud Image Storage:**
  - Integrated with Cloudinary for secure, optimized storage and delivery of student ID images. Uses Multer to manage image uploads.
- **QR Code Encryption/Decryption:**
   - Encrypts student data for QR code generation and supports decryption on the client-side.
- **Database Integration:**
  - Uses MongoDB for scalable and efficient data storage with proper indexing and unique constraints.//schema
- **Responsive UI:**
  - Clean and intuitive interface built with HTML, CSS, and JavaScript.

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js
  
- **Database:** MongoDB
  
- **Image Storage:** Cloudinary
  
- **Frontend:** HTML, CSS, JavaScript
  
- **API Design:** RESTful web services

## 📸 Screenshots


## Prerequisites
- Node.js (v14+ recommended)
- MongoDB installed and running locally
- A Cloudinary account for image hosting
- Git

## 📦 Setup & Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/DevKorrir/digital_Student_identity_io-index.html
   cd digital-student-identity

   ````
2. **install dependencies**
   ````bash
   npm install
   ````
3. **Configure Environment variables:**
   ```properties
   # MongoDB connection string
   MONGO_URI=mongodb://localhost:27017/mustid

   # Cloudinary configuration
   CLOUD_NAME=your_cloud_name
   API_KEY=your_api_key
   API_SECRET=your_api_secret

   # Secret key for encryption (64-character hex string)
   SECRET_KEY=encryption_key

   # Server port
   PORT=5002
 
   ````

4. **Start the server**
   ````bash
   npm start
   or node server.js
   ````
## **API Endpoints**
- **POST /add-student**
   - Upload a new student record. Expects a multipart/form-data request with text fields (e.g., name, studentId, email, course, year) and a file field image.

- **PUT /update-student/:id**
  - Update student details.

- **DELETE /delete-student/:id**
   - Delete a student record.

- **GET /get-students**
   - Retrieve all student records.

- **GET /get-student/:id**
   - Retrieve a single student's details.

- **POST /login**
   - Login endpoint; validates student credentials (email and studentId).
   
## 👥 Team Members

This project was developed as a group collaboration. Special thanks to all contributors:

- [DevKorrir](https://github.com/DevKorrir) – Android Developer, QR Scanner Implementation
- [Peter Mbaluka](https://github.com/)
- [Miriam Bwari](https://github.com/)
- [Maina Tom Ngure](https://github.com/Maina-ngure)
- [Victor Ndirangu](https://github.com/)
- [Eunice Mwendwa](https://github.com/)
- [Samwel Mwasi](https://github.com/)

## 📄 License

**MIT:** Feel free to adjust the content, structure, and instructions to better fit your actual project setup

