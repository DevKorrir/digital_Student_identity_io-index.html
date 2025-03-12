

// Listen for login form submission
document.getElementById("login-form").addEventListener("submit", async function(event) {
    event.preventDefault();
  
    // Retrieve the email and raw student ID input values
    const email = document.getElementById("login-email").value.trim();
    const rawStudentId = document.getElementById("login-student-id").value.trim();
  
    // Convert the raw student ID to a "safe" version by replacing slashes with underscores

    const safeStudentId = rawStudentId.replace(/\//g, '_');
  
    try {
      // Retrieve the student document from Firestore using the safe student ID
      const docRef = firebase.firestore().collection("students").doc(safeStudentId);
      const docSnap = await docRef.get();
  
      if (!docSnap.exists) {
        alert("No student found with this ID. Please check your Student ID.");
        return;
      }
  
      const studentData = docSnap.data();
  
      // Check that the provided email matches the one stored for this student
      if (studentData.email !== email) {
        alert("The email does not match the registered Student ID.");
        return;
      }

      // ✅ Store the student ID in localStorage
      localStorage.setItem("studentId", safeStudentId);

      // ✅ Store additional student data if needed
      localStorage.setItem("studentName", studentData.name || "Student");
      localStorage.setItem("studentEmail", studentData.email || "N/A");
  
      // Login successful
      alert("Login successful! Redirecting to your student dashboard...");
      window.location.href = "../student/student_dashboard.html";
  
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
  