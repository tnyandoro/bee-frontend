import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const CreateUserForm = ({ onClose }) => {
  const { currentUser, token, subdomain } = useAuth();
  const navigate = useNavigate();

  // Updated: Added last_name field
  const [formData, setFormData] = useState({
    name: "",
    last_name: "", // ← Added
    email: "",
    username: "",
    phone_number: "",
    position: "",
    role: "service_desk_agent",
    password: "",
    password_confirmation: "",
    avatar: null,
  });

  const [roleOptions, setRoleOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  // Lock scroll when modal opens
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users/roles`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const fetchedRoles = response.data.map((role) =>
          typeof role === "string"
            ? {
                value: role,
                label: role
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()),
              }
            : role
        );
        setRoleOptions(fetchedRoles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        setRoleOptions([
          { value: "call_center_agent", label: "Call Center Agent" },
          { value: "service_desk_agent", label: "Service Desk Agent" },
          { value: "service_desk_tl", label: "Service Desk Team Leader" },
          { value: "assignee_lvl_1_2", label: "Level 1/2 Support" },
          { value: "assignee_lvl_3", label: "Level 3 Support" },
          { value: "assignment_group_tl", label: "Assignment Group Team Lead" },
          { value: "service_desk_manager", label: "Service Desk Manager" },
          { value: "incident_manager", label: "Incident Manager" },
          { value: "problem_manager", label: "Problem Manager" },
          { value: "change_manager", label: "Change Manager" },
          { value: "department_manager", label: "Department Manager" },
          { value: "general_manager", label: "General Manager" },
          { value: "sub_domain_admin", label: "Sub-Domain Admin" },
          { value: "domain_admin", label: "Domain Admin" },
          { value: "system_admin", label: "System Admin" },
        ]);
      } finally {
        setRolesLoading(false);
      }
    };
    if (subdomain && token) {
      fetchRoles();
    }
  }, [subdomain, token]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    } else if (name === "avatar" && !files[0]) {
      setFormData((prev) => ({ ...prev, avatar: null }));
      setAvatarPreview(null);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCancel = () => {
    onClose ? onClose() : navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });
    try {
      const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users`;
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formDataToSend.append(`user[${key}]`, value);
        }
      });
      formDataToSend.append("organization_subdomain", subdomain);

      await axios.post(url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStatus({ loading: false, success: true, error: null });

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          last_name: "",
          email: "",
          username: "",
          phone_number: "",
          position: "",
          role: "service_desk_agent",
          password: "",
          password_confirmation: "",
          avatar: null,
        });
        setAvatarPreview(null);
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Error creating user. Please check all fields.";
      setStatus({ loading: false, error: errorMessage, success: false });
    }
  };

  // Compute full name for preview
  const fullNamePreview =
    `${formData.name} ${formData.last_name}`.trim() || "Full Name Preview";

  return (
    <PrivateRoute allowedRoles={["system_admin", "domain_admin"]}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-4 transition-opacity duration-300 overflow-y-auto">
        <div className="w-full max-w-6xl sm:rounded-lg bg-white p-6 shadow-xl scale-[.90]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Create New User
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-lg focus:outline-none"
            >
              ✕
            </button>
          </div>

          {status.error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {status.error}
            </div>
          )}

          {status.success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded">
              User created successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* First Name */}
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="First Name"
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Last Name */}
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Full Name Preview (Read-only) */}
              <input
                type="text"
                value={fullNamePreview}
                placeholder="Full Name Preview"
                disabled
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
              />

              {/* Email */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Username */}
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Phone Number */}
              <input
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Position */}
              <input
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Position"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Role */}
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              >
                {rolesLoading ? (
                  <option>Loading roles...</option>
                ) : (
                  roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                )}
              </select>

              {/* Password */}
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              {/* Confirm Password */}
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            {/* Avatar Upload */}
            <div className="mt-4">
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleChange}
                className="w-full"
              />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="mt-2 h-24 w-24 rounded-full object-cover border"
                />
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status.loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 transition"
              >
                {status.loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default CreateUserForm;
