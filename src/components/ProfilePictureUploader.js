import React, { useState } from "react";
import axios from "axios";

const ProfilePictureUploader = ({ currentImageUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append("folder", "profile_pictures");

    try {
      setUploading(true);
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      const imageUrl = res.data.secure_url;
      onUploadSuccess(imageUrl); // callback to update parent
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt="Profile"
          className="h-20 w-20 rounded-full object-cover"
        />
      )}

      <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
        {uploading ? "Uploading..." : "Upload Profile Picture"}
        <input type="file" onChange={handleFileChange} className="hidden" />
      </label>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ProfilePictureUploader;
