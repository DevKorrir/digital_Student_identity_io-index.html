document.addEventListener("DOMContentLoaded", function () {
  // Retrieve student details from localStorage
  const studentName = localStorage.getItem("studentName") || "Student";
  const studentId = localStorage.getItem("studentId") || "N/A";
  const studentEmail = localStorage.getItem("studentEmail") || "N/A";
  const studentImage = localStorage.getItem("studentImage") || "";  // Image URL

  // Display student details on the dashboard
  document.getElementById("student-name").textContent = studentName;
  document.getElementById("student-id").textContent = studentId;
  document.getElementById("student-email").textContent = studentEmail;

  // Generate QR Code Data
  const qrData = JSON.stringify({
      name: studentName,
      id: studentId,
      email: studentEmail,
      image: studentImage
  });

  // Generate QR Code
  const qrContainer = document.getElementById("qrcode-container");
  qrContainer.innerHTML = ""; // Clear previous QR code if any
  new QRCode(qrContainer, {
      text: qrData,  // Encodes student details in the QR code
      width: 200,
      height: 200
  });

  // Display student image if available
  if (studentImage) {
      const imgElement = document.createElement("img");
      imgElement.src = studentImage;
      imgElement.alt = "Student ID";
      imgElement.style = "display: block; margin-top: 10px; width: 150px; height: auto; border-radius: 10px;";
      qrContainer.appendChild(imgElement);
  }
});
