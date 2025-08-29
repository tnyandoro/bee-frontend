import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { FaUser, FaLock, FaEdit } from "react-icons/fa";
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
  const {
    currentUser,
    token,
    subdomain,
    updateUser,
    logout,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
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
  const isFetching = useRef(false);
  const renderCount = useRef(0);

  // Memoize the API instance only after auth is verified
  const api = useMemo(() => {
    if (!token || !subdomain || !currentUser) return null;
    return createApiInstance(token, subdomain);
  }, [token, subdomain, currentUser]);

  // Fetch profile data - Fixed API call to use current user endpoint
  const fetchProfile = useCallback(async () => {
    if (isFetching.current || !api || !currentUser) {
      console.log(`${new Date().toISOString()} Fetch skipped`, {
        isFetching: isFetching.current,
        api: !!api,
        currentUser: !!currentUser,
      });
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log(
        `${new Date().toISOString()} Fetching profile data for user`,
        {
          userId: currentUser.id,
          url: `/organizations/${subdomain}/profile`,
        }
      );

      // FIXED: Use the organization-scoped profile endpoint
      const res = await api.get(`/organizations/${subdomain}/profile`);

      console.log(`${new Date().toISOString()} Profile API response`, {
        status: res.status,
        data: res.data,
      });

      // Handle the nested response structure from ProfilesController
      const userData = res.data.current_user || res.data;
      setProfile(userData);
      setProfilePicture(userData.avatar_url || null);
      setFormData({
        full_name: userData.full_name || userData.name || "",
        phone_number: userData.phone_number || "",
      });
    } catch (err) {
      console.error(`${new Date().toISOString()} Fetch profile error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      const message =
        err.response?.data?.error || `Failed to load profile: ${err.message}`;

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
        navigate("/login", { replace: true });
      } else if (err.response?.status === 404) {
        setError("Profile not found. Please contact support.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [api, subdomain, currentUser, logout, navigate]);

  // Handle avatar upload
  const handleUploadSuccess = useCallback(
    async (file) => {
      if (!file || !api || !currentUser) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("user[avatar]", file);

      try {
        console.log(`${new Date().toISOString()} Uploading profile picture`, {
          userId: currentUser.id,
        });
        const response = await api.patch(
          `/organizations/${subdomain}/users/${currentUser.id}`,
          formData
        );
        console.log(
          `${new Date().toISOString()} Profile picture upload response`,
          {
            status: response.status,
            data: response.data,
          }
        );

        const newAvatarUrl = response.data.avatar_url;
        if (newAvatarUrl) {
          setProfilePicture(newAvatarUrl);
          setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
          updateUser({ avatar_url: newAvatarUrl });
          alert("Profile picture updated successfully!");
        }
      } catch (err) {
        console.error(
          `${new Date().toISOString()} Error uploading profile picture`,
          {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          }
        );
        const message = err.response?.data?.error || "Upload failed.";
        alert(message);
      } finally {
        setUploading(false);
      }
    },
    [api, currentUser, subdomain, updateUser]
  );

  // Change password - Fixed API endpoint
  const handleChangePassword = useCallback(async () => {
    if (!api || !currentUser) return;

    if (!newPassword || !confirmPassword) {
      alert("Please enter both new password and confirmation.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      console.log(`${new Date().toISOString()} Changing password`);
      // FIXED: Use the global password update endpoint
      await api.post("/password/update", {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      console.log(`${new Date().toISOString()} Password changed successfully`);
      alert("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("profile");
    } catch (err) {
      console.error(`${new Date().toISOString()} Change password error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const message = err.response?.data?.error || "Failed to change password.";
      alert(message);
    }
  }, [api, newPassword, confirmPassword, currentUser]);

  // Update profile
  const handleUpdateProfile = useCallback(async () => {
    if (!api || !currentUser) return;

    if (!formData.full_name || !formData.phone_number) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      console.log(`${new Date().toISOString()} Updating profile`, { formData });
      const response = await api.patch(
        `/organizations/${subdomain}/users/${currentUser.id}`,
        { user: formData }
      );
      console.log(`${new Date().toISOString()} Profile update response`, {
        status: response.status,
        data: response.data,
      });
      setProfile((prev) => ({ ...prev, ...response.data }));
      updateUser(response.data);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(`${new Date().toISOString()} Update profile error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const message = err.response?.data?.error || "Failed to update profile.";
      alert(message);
    }
  }, [api, formData, currentUser, subdomain, updateUser]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Log renders
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${new Date().toISOString()} Profile rendered`, {
      renderCount: renderCount.current,
      path: window.location.pathname,
      authState: {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        authLoading,
      },
    });
  });

  useEffect(() => {
    if (!authLoading && currentUser && api) {
      console.log(`${new Date().toISOString()} Starting profile fetch`);
      fetchProfile();
    }
  }, [authLoading, currentUser, api, fetchProfile]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!authLoading && (!token || !subdomain || !currentUser)) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-bold text-lg mb-2">Authentication Required</h3>
          <p>Please log in to view your profile.</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log(
                  `${new Date().toISOString()} Retrying profile fetch`
                );
                setError(null);
                setLoading(true);
                fetchProfile();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                console.log(`${new Date().toISOString()} Navigating to login`);
                logout();
                navigate("/login", { replace: true });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
            <button
              onClick={() => {
                console.log(
                  `${new Date().toISOString()} Navigating to dashboard`
                );
                navigate("/dashboard", { replace: true });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          <h3 className="font-bold text-lg mb-2">No Profile Data</h3>
          <p>No profile data available.</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log(
                  `${new Date().toISOString()} Retrying profile fetch`
                );
                setLoading(true);
                fetchProfile();
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                console.log(
                  `${new Date().toISOString()} Navigating to dashboard`
                );
                navigate("/dashboard", { replace: true });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          onClick={() => {
            setActiveTab("profile");
            setEditMode(false);
          }}
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
          onClick={() => {
            setActiveTab("profile");
            setEditMode(true);
          }}
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
              disabled={uploading}
            />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              className="w-full p-2 border rounded mb-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={uploading}
            />
            <button
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
              onClick={handleChangePassword}
              disabled={uploading}
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
                  disabled={uploading}
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
                  disabled={uploading}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
                onClick={handleUpdateProfile}
                disabled={uploading}
              >
                Save Changes
              </button>
              <button
                className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition disabled:bg-gray-400"
                onClick={() => setEditMode(false)}
                disabled={uploading}
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
