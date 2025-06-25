import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const CreateUserForm = ({ onClose }) => {
  const { currentUser, token, subdomain } = useAuth();
  const [roleOptions, setRoleOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone_number: "",
    position: "",
    role: "service_desk_agent",
    password: "",
    password_confirmation: "",
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

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

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: null }));
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    if (!subdomain || !token) {
      setStatus({
        loading: false,
        error: !subdomain
          ? "Organization context missing"
          : "Authentication token missing",
        success: false,
      });
      return;
    }

    try {
      const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users`;
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value && key !== "avatar") {
          formDataToSend.append(`user[${key}]`, value);
        }
      });
      if (formData.avatar) {
        formDataToSend.append("user[avatar]", formData.avatar);
      }
      formDataToSend.append("organization_subdomain", subdomain);

      await axios.post(url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStatus({ loading: false, success: true, error: null });

      setTimeout(() => {
        setFormData({
          name: "",
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
        error.response?.data?.error || "Error creating user.";
      setStatus({ loading: false, error: errorMessage, success: false });
    }
  };

  const handleCancel = () => {
    onClose ? onClose() : navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New User</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {status.error && (
          <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">
            {status.error}
          </div>
        )}

        {status.success && (
          <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">
            User created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium">Username *</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Password *</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Confirm Password *
              </label>
              <input
                type="password"
                name="password_confirmation"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className="mt-1 w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="mt-1 w-full border px-3 py-2 rounded"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="mt-1 w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="mt-1 w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium">
              Avatar (optional)
            </label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleChange}
              className="mt-1"
            />
            {avatarPreview && (
              <div className="mt-2">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 object-cover rounded-full"
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-sm text-red-600 mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.loading}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {status.loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateUserFormWithRoute = () => (
  <PrivateRoute allowedRoles={["system_admin", "domain_admin"]}>
    <CreateUserForm />
  </PrivateRoute>
);

export default CreateUserFormWithRoute;
