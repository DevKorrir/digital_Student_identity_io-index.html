// Now you can use firebase, db, storage, etc.
// Make sure your code in admin.js does not declare firebaseConfig again.

// Example: using firebase from the global namespace
// Function to generate QR Code
function generateQRCode(studentId) {
    const qrCodeDiv = document.getElementById("qrcode");
    qrCodeDiv.innerHTML = ""; // Clear previous QR code
    new QRCode(qrCodeDiv, studentId);
  }
  
  // Handle form submission
  document.getElementById("student-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    // Capture the raw input (e.g., "Ct206/204483/24")
    const rawStudentId = document.getElementById("studentId").value;
    const studentName = document.getElementById("name").value;
    const studentEmail = document.getElementById("email").value;
    const studentCourse = document.getElementById("course").value;  // Programme
    const studentYear = document.getElementById("year").value;
    const studentImage = document.getElementById("image").files[0];
    
    if (!rawStudentId || !studentName || !studentEmail || !studentCourse || !studentYear || !studentImage) {
        alert("Please fill all fields and upload an image.");
        return;
      }

      const emailInput = document.getElementById("email").value;
      const emailPattern = /^[a-zA-Z0-9._%+-]+@students\.must\.ac\.ke$/;
      if (!emailPattern.test(emailInput)) {
        alert("Please enter a valid school email in the format: name123456@students.must.ac.ke");
        return;
    }


  // Create a safe ID by replacing slashes with underscores
      const safeStudentId = rawStudentId.replace(/\//g, '_');

    try {
      // Upload image to Firebase Storage
      const storageRef = firebase.storage().ref(`student_images/${safeStudentId}`);
      await storageRef.put(studentImage);
      const imageUrl = await storageRef.getDownloadURL();
      
      // Save student data to Firestore
       // Save student data to Firestore
    // Use safeStudentId as the document ID so that Firestore doesn't split it on slashes.
    // Also store the original rawStudentId in a field for reference.
      await firebase.firestore().collection("students").doc(safeStudentId).set({
        studentId: rawStudentId,  // Original value for reference
        name: studentName,
        email: studentEmail,
        course: studentCourse,
        year: studentYear,
        imageUrl: imageUrl,
        status: "Active",  // Optionally set a default status
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      generateQRCode(safeStudentId);
      alert("Student registered successfully!");

      // Clear the form
      document.getElementById("student-form").reset();

      fetchAndDisplayStudents();
      
    } catch (error) {
      console.error("Error adding student: ", error);
      alert("Failed to register student. Try again.");
    }
  });

//fetch


  // Function to fetch student documents from Firestore and display them in the table
  async function fetchAndDisplayStudents() {
    const tbody = document.getElementById("students-table-body");
    if (!tbody) {
        console.error("No tbody with id 'students-table-body' found in HTML.");
        return;
    }
    tbody.innerHTML = ""; // Clear existing content
  
    try {
        const db = firebase.firestore();
        console.log("Firestore reference obtained:", db);

        // Get reference to students collection
        const studentsRef = db.collection("students");
        console.log("Collection reference:", studentsRef.path);

        // Try to get documents with extra logging
        console.log("Sending query to Firestore...");
        const querySnapshot = await studentsRef.get();

        console.log("Query complete. Response:", querySnapshot);
        console.log("Documents retrieved:", querySnapshot.size);
        console.log("Is empty:", querySnapshot.empty);

        if (querySnapshot.empty) {
            console.log("No student records found.");
            tbody.innerHTML = "<tr><td colspan='8'>No student records found</td></tr>";
            return;
        }
  
        querySnapshot.forEach(doc => {
            console.log("Doc data:", doc.data());
            const student = doc.data();
            const studentId = doc.id; // Use document ID as the student ID
  
            // Create a new table row with student details
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${studentId}</td>
                <td>${student.name || "N/A"}</td>
                <td>${student.email || "N/A"}</td>
                <td>${student.course || "N/A"}</td>
                <td>${student.year || "N/A"}</td>
                <td>${student.imageUrl ? `<img src="${student.imageUrl}" alt="Student Image" style="width:50px;height:50px;">` : "No Image"}</td>
                <td><span class="status-active">${student.status || "Active"}</span></td>
                <td class="actions">
                    <button class="btn-view" onclick="viewStudent('${studentId}')">View</button>
                    <button class="btn-edit" onclick="editStudent('${studentId}')">Edit</button>
                    <button class="btn-delete" onclick="deleteStudent('${studentId}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        tbody.innerHTML = `<tr><td colspan='8'>Error loading student data: ${error.message}</td></tr>`;
    }
}/*


async function fetchAndDisplayStudents() {
    const tbody = document.getElementById("students-table-body");
    if (!tbody) {
        console.error("No tbody with id 'students-table-body' found in HTML.");
        return;
    }
    tbody.innerHTML = ""; // Clear existing content
  
    try {
        console.log("Fetching students from nested Firestore structure...");
        
        // Get the top-level "students" collection
        const studentsCollection = firebase.firestore().collection("students");
        const topLevelDocs = await studentsCollection.get();
        
        console.log("Top level documents found:", topLevelDocs.size);
        
        // If there are no documents at all
        if (topLevelDocs.empty) {
            console.log("No student records found in the top level collection.");
            tbody.innerHTML = "<tr><td colspan='8'>No student records found</td></tr>";
            return;
        }
        
        // Track how many student records we've found total
        let studentCount = 0;
        
        // For each top-level document (like "Ct206")
        for (const docSnapshot of topLevelDocs.docs) {
            console.log("Processing department:", docSnapshot.id);
            
            // Get subcollections for this document
            const subcollections = await docSnapshot.ref.listCollections();
            console.log("Subcollections found:", subcollections.map(c => c.id));
            
            // For each subcollection (like "204483")
            for (const subcollection of subcollections) {
                console.log("Processing subcollection:", subcollection.id);
                
                // Get documents from this subcollection
                const studentDocs = await subcollection.get();
                console.log("Student documents found in subcollection:", studentDocs.size);
                
                // Process each student document
                studentDocs.forEach(studentDoc => {
                    const student = studentDoc.data();
                    const studentId = studentDoc.id; // This would be like "24"
                    const fullId = `${docSnapshot.id}/${subcollection.id}/${studentId}`;
                    
                    console.log("Processing student:", fullId, student);
                    studentCount++;
                    
                    // Create table row
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${fullId}</td>
                        <td>${student.name || "N/A"}</td>
                        <td>${student.email || "N/A"}</td>
                        <td>${student.course || "N/A"}</td>
                        <td>${student.year || "N/A"}</td>
                        <td>${student.imageUrl ? `<img src="${student.imageUrl}" alt="Student Image" style="width:50px;height:50px;">` : "No Image"}</td>
                        <td><span class="status-active">${student.status || "Active"}</span></td>
                        <td class="actions">
                            <button class="btn-view" onclick="viewStudent('${fullId}')">View</button>
                            <button class="btn-edit" onclick="editStudent('${fullId}')">Edit</button>
                            <button class="btn-delete" onclick="deleteStudent('${fullId}')">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
        
        if (studentCount === 0) {
            console.log("No student records found in any subcollection.");
            tbody.innerHTML = "<tr><td colspan='8'>No student records found</td></tr>";
        } else {
            console.log(`Total students found: ${studentCount}`);
        }
        
    } catch (error) {
        console.error("Error fetching students:", error);
        tbody.innerHTML = `<tr><td colspan='8'>Error loading student data: ${error.message}</td></tr>`;
    }
}*/
  
  // Optionally, create dummy functions for the buttons
  function viewStudent(id) {
    console.log("View student:", id);
    // Add your view logic here
  }

  function editStudent(id) {
    console.log("Edit student:", id);
    // Add your edit logic here
  }

  function deleteStudent(id) {
    if (confirm(`Are you sure you want to delete student with ID: ${id}?`)) {
      console.log("Deleting student:", id);
      
      // Delete from Firestore
      firebase.firestore().collection("students").doc(id).delete()
        .then(() => {
          console.log("Student successfully deleted!");
          // Refresh the table
          fetchAndDisplayStudents();
        })
        .catch(error => {
          console.error("Error removing student:", error);
          alert("Failed to delete student. Try again.");
        });
    }
  }
  
  // Call the function when the page loads
  document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, fetching students...");
  fetchAndDisplayStudents();
});
  
  