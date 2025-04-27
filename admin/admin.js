// Libraries

// DOM Elements
const uploadForm = document.getElementById('student-form');
const nameInput = document.getElementById('name');
const studentIdInput = document.getElementById('studentId');
const emailInput = document.getElementById('email');
const courseInput = document.getElementById('course');
const yearInput = document.getElementById('year');
const imageInput = document.getElementById('image');
const fileName = document.getElementById('fileName');
const imagePreview = document.getElementById('imagePreview');
const statusDiv = document.getElementById('status');
const studentsList = document.getElementById('students-table-body');
const submitBtn = document.getElementById('submit-btn');
const imageQualitySlider = document.getElementById('imageQuality');
const compressionValueDisplay = document.getElementById('compressionValue');

// Original selected file
let originalFile = null;

// Update compression value display
imageQualitySlider.addEventListener('input', function() {
    compressionValueDisplay.textContent = this.value + '%';
});

// Format file size to human-readable format
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Image preview functionality
imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        originalFile = file;
        fileName.textContent = file.name + ` (${formatFileSize(file.size)})`;
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:150px; border-radius:8px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        fileName.textContent = 'No file chosen';
        imagePreview.innerHTML = '<span>Image preview will appear here</span>';
        originalFile = null;
    }
});

// Helper function to show status messages
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    
    // Hide status message after 5 seconds unless it's an error
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.className = 'status';
        }, 5000);
    }
}

// Form submission handler
uploadForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate inputs
    const name = nameInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const email = emailInput.value.trim();
    const course = courseInput.value.trim();
    const year = yearInput.value.trim();

    if (!name || !studentId || !email || !course || !year) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    submitBtn.innerHTML = 'Processing... <span class="loading"></span>';
    submitBtn.disabled = true;

    try {
        // Get quality setting from slider (0.1 to 1.0)
        const quality = imageQualitySlider.value / 100;

        // Create a FormData object and append text fields
        const formData = new FormData();
        formData.append('name', name);
        formData.append('studentId', studentId);
        formData.append('email', email);
        formData.append('course', course);
        formData.append('year', year);

        // If an image file is selected, process (and optionally compress) it.
        if (originalFile) {
            // If you want to compress the image using a library like browser-image-compression,
            // ensure the library is included and then uncomment the code below:
            /*
            if (/\.(jpe?g|png)$/i.test(originalFile.name)) {
                const options = {
                    maxSizeMB: 5,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    initialQuality: quality
                };
                originalFile = await imageCompression(originalFile, options);
            }
            */
            formData.append('image', originalFile);
        } else {
            showStatus('Please select an image', 'error');
            submitBtn.innerHTML = 'Submit Data';
            submitBtn.disabled = false;
            return;
        }

        // Determine form mode (add or edit)
        const formMode = this.getAttribute('data-mode') || 'add';
        let response;
        if (formMode === 'edit') {
            // For update, you might need to adjust your server code accordingly.
            const id = this.getAttribute('data-id');
            response = await fetch(`http://localhost:5002/update-student/${id}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            response = await fetch('http://localhost:5002/add-student', {
                method: 'POST',
                body: formData
            });
        }

        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || 'Server error');
        }

        // Reset form and refresh students list
        clearForm();
        fetchStudents();
        showStatus('Student record saved successfully!', 'success');
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
        console.error('Error:', error);
    } finally {
        // Reset button state
        submitBtn.innerHTML = 'Submit Data';
        submitBtn.disabled = false;
    }
});

// Add student function now handled by the form submission (using FormData)
// The old JSON-based addStudent function is no longer used.

// Update student function (for editing via FormData) can be adjusted similarly if needed.
async function updateStudent(studentId, formData) {
    try {
        const response = await fetch(`http://localhost:5002/update-student/${studentId}`, {
            method: 'PUT',
            body: formData
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }
        return await response.json();
    } catch (error) {
        console.error('Update student error:', error);
        throw error;
    }
}

// Fetch students function with QR code generation
async function fetchStudents() {
    try {
        const response = await fetch('http://localhost:5002/get-students');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const students = await response.json();
        displayStudents(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        studentsList.innerHTML = `<tr><td colspan="8">Failed to load students data. ${error.message}</td></tr>`;
    }
}

// Display students with QR code generation
function displayStudents(students) {
    if (!studentsList) {
        console.error('Table body element not found!');
        return;
    }
    
    if (students.length === 0) {
        studentsList.innerHTML = '<tr><td colspan="8">No students found.</td></tr>';
        return;
    }
    
    let html = '';
    
    students.forEach(student => {
        html += `
            <tr>
                <td>${student.studentId}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.course}</td>
                <td>${student.year}</td>
                <td>
                    <img src="${student.image || 'default-profile.png'}" alt="${student.name}" class="student-thumbnail">
                </td>
                <td><span class="status active">Active</span></td>
                <td class="actions">
                    <button onclick="editStudent('${student._id}')" class="edit-btn">Edit</button>
                    <button onclick="deleteStudent('${student._id}')" class="delete-btn">Delete</button>
                </td>
                <td class="qr-container">
                    <div id="qr-${student._id}"></div>
                    <div class="qr-info">Student details</div>
                </td>
            </tr>
        `;
    });
    
    studentsList.innerHTML = html;
    
    // Generate QR codes after rendering
    students.forEach(student => {
        const qrData = JSON.stringify({
            studentId: student.studentId,
            name: student.name,
            email: student.email,
            course: student.course,
            imageUrl: student.image
        });
        
        new QRCode(document.getElementById(`qr-${student._id}`), {
            text: qrData,
            width: 50,
            height: 50,
            correctLevel: QRCode.CorrectLevel.L // Use lowest error correction level
        });
    });
}

// Edit student function
async function editStudent(studentId) {
    try {
        const response = await fetch(`http://localhost:5002/get-student/${studentId}`);
        const student = await response.json();
        
        // Fill the form with student data
        nameInput.value = student.name;
        studentIdInput.value = student.studentId;
        emailInput.value = student.email;
        courseInput.value = student.course;
        yearInput.value = student.year;
        
        // Update form action and button text for editing
        uploadForm.setAttribute('data-mode', 'edit');
        uploadForm.setAttribute('data-id', studentId);
        
        if (student.image) {
            imagePreview.innerHTML = `<img src="${student.image}" alt="Preview" style="max-width:150px; border-radius:8px;">`;
        }
        
        submitBtn.textContent = 'Update Student';
    } catch (error) {
        console.error('Error loading student data:', error);
        showStatus('Failed to load student data for editing', 'error');
    }
}

// Delete student function
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5002/delete-student/${studentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        showStatus(result.message, 'success');
        
        // Refresh the students list
        fetchStudents();
    } catch (error) {
        console.error('Error deleting student:', error);
        showStatus('Failed to delete student', 'error');
    }
}

// Clear form function
function clearForm() {
    uploadForm.reset();
    uploadForm.removeAttribute('data-mode');
    uploadForm.removeAttribute('data-id');
    imagePreview.innerHTML = '<span>Image preview will appear here</span>';
    fileName.textContent = 'No file chosen';
    originalFile = null;
    submitBtn.textContent = 'Add Student';
}

// Initial load of students
document.addEventListener('DOMContentLoaded', fetchStudents);
