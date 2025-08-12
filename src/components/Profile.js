import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import { FaUser, FaLock, FaArrowLeft, FaEdit } from "react-icons/fa";
import createApiInstance from "../utils/api";

// Profile Picture Uploader Component
const ProfilePictureUploader = ({ onUploadSuccess, uploading }) => {
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    // Validate file size (<5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setError("");
    onUploadSuccess(file); // Pass file to parent for upload
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
  const { currentUser, token, subdomain, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
  });

  const api = createApiInstance(token, subdomain);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!token || !subdomain) {
      setError("Please log in to view your profile.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/organizations/${subdomain}/profile`);
      setProfile(res.data);
      setProfilePicture(res.data.avatar_url || null);
      setFormData({
        full_name: res.data.full_name || "",
        phone_number: res.data.phone_number || "",
      });
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError("Failed to fetch profile data: " + message);
    } finally {
      setLoading(false);
    }
  }, [api, token, subdomain]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle avatar upload
  const handleUploadSuccess = async (file) => {
    if (!file || !currentUser || !token || !subdomain) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("user[avatar]", file);

    try {
      const response = await api.patch(
        `/organizations/${subdomain}/users/${currentUser.id}`,
        formData
      );

      const newAvatarUrl = response.data.avatar_url;
      if (newAvatarUrl) {
        setProfilePicture(newAvatarUrl);
        setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
        updateUser({ avatar_url: newAvatarUrl });
        alert("Profile picture updated successfully!");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      const message = err.response?.data?.error || "Upload failed.";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Please enter both new password and confirmation.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await api.post("/password/update", {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      alert("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("profile");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to change password.";
      alert(message);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!formData.full_name || !formData.phone_number) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await api.patch(
        `/organizations/${subdomain}/users/${currentUser.id}`,
        { user: formData }
      );
      setProfile((prev) => ({ ...prev, ...response.data }));
      updateUser(response.data);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to update profile.";
      alert(message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!profile) return <div className="p-4">No profile data available.</div>;

  const userData = profile || {};
  const isAdmin = ["system_admin", "domain_admin"].includes(userData.role);

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
              className="w-32 h-32 rounded-full border-4 border-blue-500 mb-2 object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-blue-500 bg-white shadow flex items-center justify-center mb-2 text-center text-blue-700">
              No Picture
            </div>
          )}
          <ProfilePictureUploader
            onUploadSuccess={handleUploadSuccess}
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
          onClick={() => setEditMode(true)}
        >
          <FaEdit className="mr-2" /> Edit Profile
        </label>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {activeTab === "profile" && !editMode ? (
          <div>
            {isAdmin && (
              <p className="text-green-500 mb-2">You have admin privileges.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "ID", value: userData.id },
                { key: "Full Name", value: userData.full_name },
                { key: "Email", value: userData.email },
                { key: "Username", value: userData.username },
                { key: "Phone", value: userData.phone_number },
                { key: "Position", value: userData.position },
                { key: "Department ID", value: userData.department_id },
                { key: "Team ID", value: userData.team_id },
                { key: "Role", value: userData.role },
                { key: "Organization ID", value: userData.organization_id },
                {
                  key: "Organization Subdomain",
                  value: userData.organization_subdomain,
                },
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
        ) : activeTab === "settings" ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <input
              type="password"
              name="new_password"
              placeholder="New Password"
              className="w-full p-2 border rounded mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              name="confirm_password"
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
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-start mb-2">
                <label className="font-bold text-lg">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex flex-col items-start mb-2">
                <label className="font-bold text-lg">Phone</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={handleUpdateProfile}
              >
                Save Changes
              </button>
              <button
                className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
