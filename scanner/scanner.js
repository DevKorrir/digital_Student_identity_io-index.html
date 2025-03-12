// Scanner configuration
const scannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    showTorchButtonIfSupported: true
};

// Status messages
const STATUS = {
    SCANNING: { text: "Scanning in progress...", class: "scanning" },
    SUCCESS: { text: "QR Code scanned successfully!", class: "success" },
    ERROR: { text: "Error parsing QR code data.", class: "error" }
};

// Update scanner status
function updateStatus(status) {
    const statusElement = document.getElementById('scannerInfo');
    statusElement.textContent = status.text;
    statusElement.className = `scanner-status ${status.class}`;
}

// Update student details
function updateStudentDetails(data) {
    document.getElementById('studentName').textContent = data.name || 'N/A';
    document.getElementById('studentID').textContent = data.studentId || 'N/A';
    document.getElementById('studentEmail').textContent = data.email || 'N/A';
    
    // Update image if available
    const imageElement = document.getElementById('studentImage');
    if (data.image) {
        imageElement.src = data.image;
    } else {
        imageElement.src = 'placeholder.png';
    }
}

// Success callback
function onScanSuccess(decodedText, decodedResult) {
    try {
        const data = JSON.parse(decodedText);
        updateStudentDetails(data);
        updateStatus(STATUS.SUCCESS);
        
        // Add success animation
        const scanRegion = document.querySelector('.scan-region');
        scanRegion.style.borderColor = '#16a34a';
        setTimeout(() => {
            scanRegion.style.borderColor = '#5563DE';
        }, 1000);
        
    } catch (error) {
        console.error('Error parsing QR code:', error);
        updateStatus(STATUS.ERROR);
    }
}

// Failure callback
function onScanFailure(error) {
    // Only update status if it's not already showing success or error
    const currentStatus = document.getElementById('scannerInfo').textContent;
    if (!currentStatus.includes('success') && !currentStatus.includes('Error')) {
        updateStatus(STATUS.SCANNING);
    }
}

// Initialize scanner
document.addEventListener('DOMContentLoaded', function() {
    const html5QrCodeScanner = new Html5QrcodeScanner(
        "scanner",
        scannerConfig,
        /* verbose= */ false
    );
    
    html5QrCodeScanner.render(onScanSuccess, onScanFailure);
    
    // Initial status
    updateStatus(STATUS.SCANNING);
});