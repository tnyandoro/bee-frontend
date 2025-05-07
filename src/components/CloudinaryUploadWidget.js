import React from "react";

const CloudinaryUploadWidget = ({ onUpload }) => {
  const cloudName = process.env.REACT_APP_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_UPLOAD_PRESET;

  const openWidget = () => {
    window.cloudinary.openUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ["local", "camera", "url"],
        multiple: false,
        cropping: false,
        folder: "problems",
      },
      function (error, result) {
        if (!error && result && result.event === "success") {
          console.log("Upload Success:", result.info);
          onUpload(result.info.secure_url);
        } else if (error) {
          console.error("Upload Widget Error:", error);
        }
      }
    );
  };

  return (
    <button
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      onClick={openWidget}
    >
      Upload Attachment
    </button>
  );
};

export default CloudinaryUploadWidget;
