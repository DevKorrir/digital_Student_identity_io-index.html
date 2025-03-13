document.addEventListener("DOMContentLoaded", function () {
    const startCameraButton = document.getElementById("start-camera");
    const cameraSelect = document.getElementById("camera-select");
    const scanStatus = document.getElementById("scan-status");
    const resultContainer = document.getElementById("result-container");
    const scannerView = document.querySelector(".scanner-view");

    let html5QrCode;

    // When the "Start Camera" button is clicked, enumerate and select a camera
    startCameraButton.addEventListener("click", function () {
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                cameraSelect.innerHTML = "";
                cameras.forEach(camera => {
                    const option = document.createElement("option");
                    option.value = camera.id;
                    option.text = camera.label || `Camera ${camera.id}`;
                    cameraSelect.appendChild(option);
                });
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

    // Allow switching cameras if a different one is selected
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

    // Function to start scanning using the selected camera
    function startScanning(cameraId) {
        // Clear any previous instance
        if (html5QrCode) {
            html5QrCode.clear();
        }
        // Create a new instance with the element id "scanner-preview"
        html5QrCode = new Html5Qrcode("scanner-preview");
        html5QrCode.start(
            { deviceId: { exact: cameraId } },
            {
                fps: 10,
                qrbox: 250
            },
            qrCodeMessage => {
                // On a successful scan, process the data and stop scanning
                processScannedData(qrCodeMessage);
                html5QrCode.stop();
            },
            errorMessage => {
                // Filter out errors related to getImageData (width = 0) to prevent unnecessary warnings
                if (errorMessage && errorMessage.indexOf("getImageData") !== -1) {
                    return;
                }
                console.warn("QR Code scan error:", errorMessage);
            }
        ).then(() => {
            scanStatus.textContent = "Scanning...";
        }).catch(err => {
            console.error(err);
            scanStatus.textContent = "Error starting scanner.";
        });
    }

    // Process the scanned QR code content (expects JSON)
    function processScannedData(qrCodeMessage) {
        try {
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

            // Optionally display email or other details if needed
            document.getElementById("student-email").textContent = "Email: " + (studentData.email || "N/A");
            document.getElementById("verification-time").textContent = "Time: " + new Date().toLocaleString();
            document.getElementById("result-status").textContent = "Verified";

            // Show the result container and hide the scanner view
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
        resultContainer.classList.add("hidden");
        scannerView.style.display = "block";
        scanStatus.textContent = "Camera not started. Click the button above to begin scanning.";
    });
});
