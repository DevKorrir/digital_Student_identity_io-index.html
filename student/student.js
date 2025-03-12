
  
  // Assume the student's safe ID (e.g., "Ct206_123456_24") is stored in localStorage during login.
  const safeStudentId = localStorage.getItem("studentId");

  console.log("Retrieved studentId from localStorage:", safeStudentId); 
  
  // If no studentId found in localStorage, redirect to login page.
  if (!safeStudentId) {
    console.warn("No studentId found in localStorage. Redirecting to login.");
    window.location.href = "../login/login.html";
  } else {
    // Fetch the student document from Firestore
    db.collection("students").doc(safeStudentId).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          // Update UI with student data
          document.getElementById("student-name").textContent = data.name || "Student";
          // Show the original student ID if stored; otherwise, display the safe ID.
          document.getElementById("student-id").textContent = data.studentId || safeStudentId;
          document.getElementById("student-email").textContent = data.email || "N/A";
  
          // Generate the QR code using the safeStudentId or any string representing the student's digital ID.
          new QRCode(document.getElementById("qrcode-container"), {
            text: safeStudentId,
            width: 220,
            height: 220,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
          });
        } else {
          alert("Student record not found.");
        }
      })
      .catch(error => {
        console.error("Error fetching student data:", error);
      });
  }
  