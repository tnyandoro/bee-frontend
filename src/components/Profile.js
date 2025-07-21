import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/authContext";
import { FaUpload, FaLock, FaUser, FaArrowLeft } from "react-icons/fa";
import axios from "axios";

const api = axios.create({
  baseURL: "https://itsm-api.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Upload button component
const ProfilePictureUploader = ({ onUploadSuccess, uploading }) => {
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_upload_preset"); // 🔁 Replace
    formData.append("folder", "profile_pictures");

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", // 🔁 Replace
        formData
      );
      onUploadSuccess(res.data.secure_url);
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setError("Failed to upload image.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
        {uploading ? "Uploading..." : "Attach Photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("authToken");
      const subdomain = localStorage.getItem("subdomain");

      if (!token || !subdomain) {
        setError("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/organizations/${subdomain}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
        setProfilePicture(res.data.user?.profile_picture_url || null);
      } catch (err) {
        const message = err.response?.data?.error || err.message;
        setError("Failed to fetch profile data: " + message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleUploadToBackend = async (imageUrl) => {
    const token = localStorage.getItem("authToken");
    const subdomain = localStorage.getItem("subdomain");

    setUploading(true);
    try {
      await axios.post(
        "https://itsm-api.onrender.com/api/v1/uploads/upload_profile_picture",
        { file: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const res = await api.get(`/organizations/${subdomain}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(res.data);
      setProfilePicture(res.data.user?.profile_picture_url || null);
      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error(
        "Error saving profile picture:",
        err.response?.data || err.message
      );
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword) {
      alert("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("profile");
    } else {
      alert("Passwords do not match!");
    }
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!profile) return <div className="p-4">No profile data available.</div>;

  const userData = profile.user || {};
  const isAdmin = ["admin", "super_user"].includes(userData.role);

  return (
    <div className="bg-gray-300 p-5 mt-10 flex">
      {/* Sidebar */}
      <div className="bg-blue-700 p-4 rounded-l-lg text-white w-1/4">
        <div className="p-2 mx-auto bg-blue-700 shadow-5xl mb-6 mt-10 text-center">
          <h2 className="text-xl mb-6">My Profile</h2>
        </div>

        <div className="flex flex-col items-center mr-10 mb-4">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-blue-500 mb-2"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-blue-500 bg-white shadow flex items-center justify-center mb-2 text-center text-blue-700">
              No Picture
            </div>
          )}
          <ProfilePictureUploader
            onUploadSuccess={handleUploadToBackend}
            uploading={uploading}
          />
        </div>

        <label
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
          onClick={() => setActiveTab("profile")}
        >
          <FaUser className="mr-2" /> My Profile
        </label>
        <label
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
          onClick={() => setActiveTab("settings")}
        >
          <FaLock className="mr-2" /> Change Password
        </label>
        <label
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
          onClick={() => alert("Profile updated!")}
        >
          <FaArrowLeft className="mr-2" /> Update Profile
        </label>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {activeTab === "profile" ? (
          <div>
            {isAdmin && (
              <p className="text-green-500 mb-2">You have admin privileges.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "ID", value: userData.id },
                { key: "Full Name", value: userData.name },
                { key: "Password", value: "*********" },
                { key: "Email", value: userData.email },
                { key: "Username", value: userData.username },
                { key: "Phone", value: userData.phone_number },
                { key: "Department", value: userData.department },
                { key: "Position", value: userData.position },
                { key: "Organization ID", value: profile.organization?.id },
                { key: "Organization Name", value: profile.organization?.name },
                { key: "Team ID", value: userData.team_id },
                { key: "Role", value: userData.role },
              ].map(({ key, value }, i) => (
                <div key={i} className="flex flex-col items-start mb-2">
                  <div className="font-bold text-lg">{key}</div>
                  <div className="border border-blue-500 bg-white p-2 w-full text-lg text-left">
                    {value || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-2 border rounded mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-2 border rounded mb-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleChangePassword}
            >
              Change Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
