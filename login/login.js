  


document.getElementById("login-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const studentId = document.getElementById("login-student-id").value.trim();

  try {
      const response = await fetch("http://localhost:5002/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, studentId})
      });

      const data = await response.json();

      if (!response.ok) {
          alert(data.message);
          return;
      }

      // Store student info in localStorage
      localStorage.setItem("studentId", data.studentId);
      localStorage.setItem("studentName", data.name);
      localStorage.setItem("studentEmail", data.email);
      localStorage.setItem("studentImage", data.image);
      


      alert("Login successful! Redirecting to your student dashboard...");
      window.location.href = "../student/student_dashboard.html";
  } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login. Please try again.");
  }
});
