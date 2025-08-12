import React, { useEffect, useState, useCallback, useRef } from "react";
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
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
  });

  // Create API instance once
  const api = useRef(createApiInstance(token, subdomain)).current;

  // Track whether fetchProfile has been called
  const isFetching = useRef(false);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!token || !subdomain || isFetching.current) {
      if (!token || !subdomain) {
        setError("Please log in to view your profile.");
      }
      setLoading(false);
      return;
    }

    isFetching.current = true;
    try {
      const res = await api.get(`/organizations/${subdomain}/profile`);
      console.log("Profile API response:", res.data); // Debug log
      setProfile(res.data.user);
      setOrganization(res.data.organization);
      setProfilePicture(res.data.user.profile_picture_url || null);
      setFormData({
        name: res.data.user.name || "",
        phone_number: res.data.user.phone_number || "",
      });
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      console.error("Fetch profile error:", message); // Debug log
      setError("Failed to fetch profile data: " + message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [api, token, subdomain]);

  // Fetch profile only once on mount or when token/subdomain changes
  useEffect(() => {
    console.log("useAuth values:", { token, subdomain }); // Debug log
    fetchProfile();
  }, [fetchProfile]);

  // Handle avatar upload
  const handleUploadSuccess = async (file) => {
    if (!file || !currentUser || !token || !subdomain) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("user[profile_picture]", file);

    try {
      const response = await api.patch(
        `/organizations/${subdomain}/users/${currentUser.id}`,
        formData
      );
      const newProfilePictureUrl = response.data.profile_picture_url;
      if (newProfilePictureUrl) {
        setProfilePicture(newProfilePictureUrl);
        setProfile((prev) => ({
          ...prev,
          profile_picture_url: newProfilePictureUrl,
        }));
        updateUser({ profile_picture_url: newProfilePictureUrl });
        alert("Profile picture updated successfully!");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err); // Debug log
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
      console.error("Change password error:", message); // Debug log
      alert(message);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.phone_number) {
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
      console.error("Update profile error:", message); // Debug log
      alert(message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!profile || !organization)
    return <div className="p-4">No profile data available.</div>;

  const isAdmin = profile.is_admin;

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
          onClick={() => setActiveTab("profile") && setEditMode(true)}
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
            <h2 className="text-xl font-semibold mb-4">User Profile</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "ID", value: profile.id },
                { key: "Name", value: profile.name },
                { key: "Email", value: profile.email },
                { key: "Username", value: profile.username },
                { key: "Phone", value: profile.phone_number },
                { key: "Position", value: profile.position },
                { key: "Department ID", value: profile.department_id },
                { key: "Team ID", value: profile.team_id },
                { key: "Role", value: profile.role },
                { key: "Organization ID", value: profile.organization_id },
                { key: "Team IDs", value: profile.team_ids?.join(", ") },
              ].map(({ key, value }, i) => (
                <div key={i} className="flex flex-col items-start mb-2">
                  <div className="font-bold text-lg">{key}</div>
                  <div className="border border-blue-500 bg-white p-2 w-full text-lg text-left">
                    {value || "N/A"}
                  </div>
                </div>
              ))}
            </div>
            <h2 className="text-xl font-semibold mb-4 mt-6">
              Organization Profile
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "ID", value: organization.id },
                { key: "Name", value: organization.name },
                { key: "Subdomain", value: organization.subdomain },
                { key: "Web Address", value: organization.web_address },
                { key: "Phone Number", value: organization.phone_number },
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
                <label className="font-bold text-lg">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
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
