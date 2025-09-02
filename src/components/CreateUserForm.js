import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const CreateUserForm = ({ onClose }) => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const [roleOptions] = useState([
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
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files?.[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    } else if (name === "avatar") {
      setFormData((prev) => ({ ...prev, avatar: null }));
      setAvatarPreview(null);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCancel = useCallback(() => {
    onClose?.() || navigate("/dashboard");
  }, [onClose, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL; // use .env for dev/prod
      const url = `${apiBaseUrl}/organizations/${subdomain}/users`;

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "")
          formDataToSend.append(`user[${key}]`, value);
      });
      formDataToSend.append("organization_subdomain", subdomain);

      await axios.post(url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStatus({ loading: false, success: true, error: null });

      // Reset form
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

      setTimeout(() => onClose?.(), 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Error creating user. Please check all fields.";
      setStatus({ loading: false, error: errorMessage, success: false });
    }
  };

  const fullNamePreview =
    `${formData.name} ${formData.last_name}`.trim() || "Full Name Preview";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Create New User
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="w-6 h-6" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Full Name Preview */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullNamePreview}
                disabled
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {avatarPreview && (
              <div className="mt-3 flex items-center">
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="h-16 w-16 rounded-full object-cover border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, avatar: null }));
                    setAvatarPreview(null);
                  }}
                  className="ml-3 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition"
            >
              {status.loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserForm;
