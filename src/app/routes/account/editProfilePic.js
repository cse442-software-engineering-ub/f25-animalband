import { useState } from "react";

export default function EditProfilePic() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/uploadProfile.php",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Profile picture updated!");
      } else {
        alert(data.message);
      }
    } catch {
      alert("Upload failed");
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Profile Picture</button>

      <div style={{ marginTop: "20px" }}>
        <h3>Current Profile Picture</h3>
        <img
          src="https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getProfilePic.php"
          alt="Profile"
          style={{ width: "150px", height: "150px", borderRadius: "50%" }}
        />
      </div>
    </div>
  );
}