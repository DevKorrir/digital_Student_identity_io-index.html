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
  
    // Check if an image URL exists
    if (!studentImage) {
      console.warn("No student image URL available to encode.");
      return;
    }

    // Compute expiration timestamp (5 minutes from now)
  const expiresAt = Date.now() + (5 * 60 * 1000);
  
    // Generate QR Code Data: encode the image URL directly
    //const qrData = studentImage;
    // Create an object with all necessary details
    const studentData = {
      name: studentName,
      id: studentId,
      email: studentEmail,
      image: studentImage,
      expiresAt: expiresAt
    };

    const dataString = JSON.stringify(studentData);

    // -------------------------------
  // Encryption Part using CryptoJS
  // -------------------------------
  // Replace 'YOUR_SECRET_KEY' with your actual secret key
  const secretKey = "e92fa574c0742f4112944f79c813cf2f3d26f169d1ba966ac28feb5721c65e97";

   // Encrypt the dataString using AES encryption
   const encryptedData = CryptoJS.AES.encrypt(dataString, secretKey).toString();

   // For debugging: log the encrypted data
   console.log("Encrypted Data:", encryptedData);
 
   // This is what you'll encode in the QR code now
   const qrData = encryptedData;
  
    // Generate QR Code
    const qrContainer = document.getElementById("qrcode-container");
    qrContainer.innerHTML = ""; // Clear previous QR code if any
    new QRCode(qrContainer, {
        text: qrData,  // Encodes the encrypted data
        width: 300,              // Increased width
        height: 300,             // Increased height
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
  
    // // Optionally, display the image below the QR code for confirmation
    // const imgElement = document.createElement("img");
    // imgElement.src = studentImage;
    // imgElement.alt = "Student Image";
    // imgElement.style = "display: block; margin-top: 10px; width: 150px; height: auto; border-radius: 10px;";
    // qrContainer.appendChild(imgElement);

     // Create a separate container for the image preview below the QR code
  const imagePreviewContainer = document.createElement("div");
  imagePreviewContainer.style.marginTop = "10px";
  imagePreviewContainer.style.textAlign = "center";

  const imgElement = document.createElement("img");
  imgElement.src = studentImage;
  imgElement.alt = "Student Image";
  // Set the image preview to be smaller
  imgElement.style.width = "100px";
  imgElement.style.height = "auto";
  imgElement.style.borderRadius = "10px";

  imagePreviewContainer.appendChild(imgElement);
  qrContainer.appendChild(imagePreviewContainer);
  });
  

  //generate 64 char hexadecimal ecryption key 
  //node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"

  //decrypt
//   const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
// const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
// console.log("Decrypted Data:", JSON.parse(decryptedData));

