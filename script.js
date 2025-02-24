// Get DOM elements
const form = document.getElementById('student-form');
const formSection = document.getElementById('form-section');
const qrcodeSection = document.getElementById('qrcode-section');
const qrcodeContainer = document.getElementById('qrcode');
const backButton = document.getElementById('back-button');
const downloadBtn = document.getElementById('downloadBtn');

const displayImage = document.getElementById('displayImage');
const displayName = document.getElementById('displayName');
const displayStudentId = document.getElementById('displayStudentId');
const displayEmail = document.getElementById('displayEmail');
const imagePreview = document.getElementById('imagePreview');

// Handle image upload and preview
document.getElementById('image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Preview';
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
        }
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
});

// Handle form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('name').value;
    const studentId = document.getElementById('studentId').value;
    const email = document.getElementById('email').value;
    const imageFile = document.getElementById('image').files[0];

    // Create student data object
    const studentData = {
        name,
        studentId,
        email,
        timestamp: new Date().toISOString()
    };

    // Generate QR code
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, {
        text: JSON.stringify(studentData),
        width: 200,
        height: 200,
        colorDark: '#5563DE',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    // Update display information
    displayName.textContent = name;
    displayStudentId.textContent = `ID: ${studentId}`;
    displayEmail.textContent = email;

    // Handle image display
    if(imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            displayImage.src = event.target.result;
        }
        reader.readAsDataURL(imageFile);
    }

    // Show QR code section
    formSection.style.display = 'none';
    qrcodeSection.style.display = 'block';

    // Enable download after short delay
    setTimeout(enableDownload, 100);
});

// Enable QR code download
function enableDownload() {
    const qrCanvas = qrcodeContainer.querySelector('canvas');
    if (qrCanvas) {
        const dataURL = qrCanvas.toDataURL('image/png');
        downloadBtn.disabled = false;
        downloadBtn.onclick = function() {
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `student_qr_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }
}

// Handle back button
backButton.addEventListener('click', function() {
    // Reset form
    form.reset();
    imagePreview.innerHTML = '';
    
    // Reset download button
    downloadBtn.disabled = true;
    
    // Switch views
    qrcodeSection.style.display = 'none';
    formSection.style.display = 'block';
});