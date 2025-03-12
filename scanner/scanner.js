// // Scanner configuration
// const scannerConfig = {
//     fps: 10,
//     qrbox: { width: 250, height: 250 },
//     aspectRatio: 1.0,
//     showTorchButtonIfSupported: true
// };

// // Status messages
// const STATUS = {
//     SCANNING: { text: "Scanning in progress...", class: "scanning" },
//     SUCCESS: { text: "QR Code scanned successfully!", class: "success" },
//     ERROR: { text: "Error parsing QR code data.", class: "error" }
// };

// // Update scanner status
// function updateStatus(status) {
//     const statusElement = document.getElementById('scannerInfo');
//     statusElement.textContent = status.text;
//     statusElement.className = `scanner-status ${status.class}`;
// }

// // Update student details
// function updateStudentDetails(data) {
//     document.getElementById('studentName').textContent = data.name || 'N/A';
//     document.getElementById('studentID').textContent = data.studentId || 'N/A';
//     document.getElementById('studentEmail').textContent = data.email || 'N/A';
    
//     // Update image if available
//     const imageElement = document.getElementById('studentImage');
//     if (data.image) {
//         imageElement.src = data.image;
//     } else {
//         imageElement.src = 'placeholder.png';
//     }
// }

// // Success callback
// function onScanSuccess(decodedText, decodedResult) {
//     try {
//         const data = JSON.parse(decodedText);
//         updateStudentDetails(data);
//         updateStatus(STATUS.SUCCESS);
        
//         // Add success animation
//         const scanRegion = document.querySelector('.scan-region');
//         scanRegion.style.borderColor = '#16a34a';
//         setTimeout(() => {
//             scanRegion.style.borderColor = '#5563DE';
//         }, 1000);
        
//     } catch (error) {
//         console.error('Error parsing QR code:', error);
//         updateStatus(STATUS.ERROR);
//     }
// }

// // Failure callback
// function onScanFailure(error) {
//     // Only update status if it's not already showing success or error
//     const currentStatus = document.getElementById('scannerInfo').textContent;
//     if (!currentStatus.includes('success') && !currentStatus.includes('Error')) {
//         updateStatus(STATUS.SCANNING);
//     }
// }

// // Initialize scanner
// document.addEventListener('DOMContentLoaded', function() {
//     const html5QrCodeScanner = new Html5QrcodeScanner(
//         "scanner",
//         scannerConfig,
//         /* verbose= */ false
//     );
    
//     html5QrCodeScanner.render(onScanSuccess, onScanFailure);
    
//     // Initial status
//     updateStatus(STATUS.SCANNING);
// });


document.addEventListener("DOMContentLoaded", function () {
    const startCameraButton = document.getElementById("start-camera");
    const cameraSelect = document.getElementById("camera-select");
    const scanStatus = document.getElementById("scan-status");
    const resultContainer = document.getElementById("result-container");
    const scannerView = document.querySelector(".scanner-view");

    let html5QrCode;

    // When the "Start Camera" button is clicked
    startCameraButton.addEventListener("click", function () {
        // Enumerate available cameras
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                // Populate the camera dropdown
                cameraSelect.innerHTML = "";
                cameras.forEach(camera => {
                    const option = document.createElement("option");
                    option.value = camera.id;
                    option.text = camera.label || `Camera ${camera.id}`;
                    cameraSelect.appendChild(option);
                });
                // Auto-select the first camera and start scanning
                cameraSelect.selectedIndex = 0;
                startScanning(cameraSelect.value);
            } else {
                scanStatus.textContent = "No cameras found.";
            }
        }).catch(err => {
            console.error(err);
            scanStatus.textContent = "Error accessing cameras.";
        });
    });

    // Allow switching camera if a different one is selected
    cameraSelect.addEventListener("change", function () {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                startScanning(cameraSelect.value);
            }).catch(err => {
                console.error(err);
                scanStatus.textContent = "Error switching camera.";
            });
        }
    });

    // Start scanning using the selected camera
    function startScanning(cameraId) {
        // If a previous instance exists, clear it.
        if (html5QrCode) {
            html5QrCode.clear();
        }
        // Create a new instance of Html5Qrcode with the container id "scanner-preview"
        html5QrCode = new Html5Qrcode("scanner-preview");
        html5QrCode.start(
            { deviceId: { exact: cameraId } },
            {
                fps: 10,
                qrbox: 250
            },
            qrCodeMessage => {
                // Process the scanned QR code data
                processScannedData(qrCodeMessage);
                // Stop scanning after a successful scan
                html5QrCode.stop();
            },
            errorMessage => {
                // Optionally update status for scanning errors
                console.warn("QR Code scan error:", errorMessage);
            }
        ).then(() => {
            scanStatus.textContent = "Scanning...";
        }).catch(err => {
            console.error(err);
            scanStatus.textContent = "Error starting scanner.";
        });
    }

    // Process the scanned QR code content
    function processScannedData(qrCodeMessage) {
        try {
            // Parse the QR code text as JSON
            const studentData = JSON.parse(qrCodeMessage);
            
            // Update student details in the result container
            document.getElementById("student-name").textContent = studentData.name || "N/A";
            document.getElementById("student-id").textContent = "ID: " + (studentData.id || "N/A");

            // Update the student image if available
            const studentImageElement = document.getElementById("student-image");
            if (studentData.image) {
                studentImageElement.src = studentData.image;
                studentImageElement.style.display = "block";
            } else {
                studentImageElement.style.display = "none";
            }

            // Optionally, record the verification time
            document.getElementById("verification-time").textContent = "Time: " + new Date().toLocaleString();

            // Update the result status badge
            document.getElementById("result-status").textContent = "Verified";

            // Show the result container and hide the scanning view
            resultContainer.classList.remove("hidden");
            scannerView.style.display = "none";
            scanStatus.textContent = "QR Code scanned successfully!";
        } catch (error) {
            console.error("Error processing QR code:", error);
            scanStatus.textContent = "Invalid QR code data!";
        }
    }

    // "Scan New Code" button resets the scanner to allow another scan.
    document.getElementById("scan-new").addEventListener("click", function () {
        // Hide result container and show the scanner view again.
        resultContainer.classList.add("hidden");
        scannerView.style.display = "block";
        scanStatus.textContent = "Camera not started. Click the button above to begin scanning.";
    });

    // Optional: Add functionality for "Verify Identity" and "Deny Access" as needed.
});
