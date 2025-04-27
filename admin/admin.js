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

// Table pagination and display functionality
let currentPage = 1;
const recordsPerPage = 5;
let allStudents = [];

// Fetch students function with pagination support
async function fetchStudents() {
    try {
        const response = await fetch('http://localhost:5002/get-students');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allStudents = await response.json();
        updatePagination();
        displayStudents();
    } catch (error) {
        console.error('Error fetching students:', error);
        studentsList.innerHTML = `<tr><td colspan="8">Failed to load students data. ${error.message}</td></tr>`;
        document.getElementById('empty-state').style.display = 'block';
    }
}

// Update pagination info and controls
function updatePagination() {
    const totalStudents = allStudents.length;
    const totalPages = Math.ceil(totalStudents / recordsPerPage);
    
    // Update text info
    document.getElementById('total-records').textContent = totalStudents;
    const startRecord = totalStudents === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalStudents);
    document.getElementById('start-record').textContent = startRecord;
    document.getElementById('end-record').textContent = endRecord;
    
    // Generate page number buttons
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    // Determine range of page numbers to display
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add first page if not in range
    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.textContent = '1';
        firstPageBtn.addEventListener('click', () => goToPage(1));
        pageNumbers.appendChild(firstPageBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'page-ellipsis';
            pageNumbers.appendChild(ellipsis);
        }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === currentPage) {
            pageBtn.className = 'active';
        }
        pageBtn.addEventListener('click', () => goToPage(i));
        pageNumbers.appendChild(pageBtn);
    }
    
    // Add last page if not in range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'page-ellipsis';
            pageNumbers.appendChild(ellipsis);
        }
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', () => goToPage(totalPages));
        pageNumbers.appendChild(lastPageBtn);
    }
    
    // Update prev/next buttons
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    
    // Add event listeners to prev/next buttons
    document.getElementById('prev-page').onclick = () => goToPage(currentPage - 1);
    document.getElementById('next-page').onclick = () => goToPage(currentPage + 1);
    
    // Show empty state if no students
    document.getElementById('empty-state').style.display = totalStudents === 0 ? 'block' : 'none';
}

// Go to specific page
function goToPage(page) {
    currentPage = page;
    displayStudents();
    updatePagination();
}

// Display students for current page
function displayStudents() {
    if (!studentsList) {
        console.error('Table body element not found!');
        return;
    }
    
    if (allStudents.length === 0) {
        studentsList.innerHTML = '<tr><td colspan="8">No students found.</td></tr>';
        return;
    }
    
    // Calculate slice for current page
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedStudents = allStudents.slice(start, end);
    
    let html = '';
    
    paginatedStudents.forEach(student => {
        // Truncate long strings
        const truncatedEmail = student.email.length > 25 ? 
            student.email.substring(0, 12) + '...' + student.email.substring(student.email.indexOf('@')) : 
            student.email;
        
        const truncatedName = student.name.length > 20 ? 
            student.name.substring(0, 17) + '...' : 
            student.name;
            
        const truncatedCourse = student.course.length > 20 ? 
            student.course.substring(0, 17) + '...' : 
            student.course;
        
        html += `
            <tr>
                <td class="student-id">${student.studentId}</td>
                <td class="truncate" title="${student.name}">${truncatedName}</td>
                <td class="truncate" title="${student.email}">${truncatedEmail}</td>
                <td class="truncate" title="${student.course}">${truncatedCourse}</td>
                <td>${student.year}</td>
                <td>
                    <div class="student-thumbnail-container">
                        <img src="${student.image || '/assets/default-profile.png'}" alt="${student.name}" class="student-thumbnail">
                    </div>
                </td>
                <td>
                    <span class="status-badge active">Active</span>
                </td>
                <td class="actions">
                    <button onclick="viewStudent('${student._id}')" class="action-btn view-btn" data-tooltip="View">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                        </svg>
                    </button>
                    <button onclick="editStudent('${student._id}')" class="action-btn edit-btn" data-tooltip="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                    </button>
                    <button onclick="deleteStudent('${student._id}')" class="action-btn delete-btn" data-tooltip="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    });
    
    studentsList.innerHTML = html;
    
    // Generate QR codes after rendering (if needed)
    // This is removed from the main display for a cleaner table
    // You can add a QR view in the view student modal instead
}

// View student function (new)
function viewStudent(studentId) {
    // Find student from allStudents array
    const student = allStudents.find(s => s._id === studentId);
    if (!student) return;
    
    // Generate QR code data
    const qrData = JSON.stringify({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        course: student.course,
        imageUrl: student.image
    });
    
    // Here you would open a modal with student details and QR code
    // For now just show an alert
    alert(`Viewing student: ${student.name}\nQR data contains student details`);
    
    // In a real implementation, you would open a modal with:
    // - Student full details
    // - QR code generated with the qrData
    // - Option to print ID card
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
