import React, { useState } from "react";

const CloudinaryUploadWidget = ({ onUpload, setFeedback }) => {
  const cloudName = process.env.REACT_APP_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_UPLOAD_PRESET;
  const [uploading, setUploading] = useState(false);

  const openWidget = () => {
    setUploading(true);
    if (setFeedback) setFeedback("Uploading started...");

    window.cloudinary.openUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "camera", "url"],
        multiple: false,
        cropping: false,
        folder: "profile_pictures",
      },
      function (error, result) {
        setUploading(false);

        if (!error && result && result.event === "success") {
          console.log("Upload Success:", result.info);
          if (setFeedback) setFeedback("Upload successful!");
          onUpload(result.info.secure_url);
        } else if (error) {
          console.error("Upload Widget Error:", error);
          if (setFeedback) setFeedback("Upload failed. Please try again.");
        } else {
          if (setFeedback) setFeedback("Upload cancelled or failed.");
        }
      }
    );
  };

  return (
    <button
      className={`px-4 py-2 rounded text-white ${
        uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
      }`}
      onClick={openWidget}
      disabled={uploading}
    >
      {uploading ? (
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          <span>Uploading...</span>
        </div>
      ) : (
        "Upload Picture"
      )}
    </button>
  );
};

export default CloudinaryUploadWidget;
