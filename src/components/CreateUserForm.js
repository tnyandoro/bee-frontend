import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const CreateUserForm = ({ onClose }) => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();
  const [roleOptions, setRoleOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
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
          headers: { Authorization: `Bearer ${token}` },
        });
        const roles = response.data.map((role) =>
          typeof role === "string"
            ? {
                value: role,
                label: role
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
              }
            : role
        );
        setRoleOptions(roles);
      } catch (error) {
        setRoleOptions([
          { value: "service_desk_agent", label: "Service Desk Agent" },
          { value: "domain_admin", label: "Domain Admin" },
        ]);
      } finally {
        setRolesLoading(false);
      }
    };
    if (subdomain && token) fetchRoles();
  }, [subdomain, token]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users`;
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v && k !== "avatar") body.append(`user[${k}]`, v);
      });
      if (formData.avatar) {
        body.append("user[avatar]", formData.avatar);
      }
      body.append("organization_subdomain", subdomain);

      await axios.post(url, body, {
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
        onClose ? onClose() : navigate("/dashboard");
      }, 1500);
    } catch (error) {
      const message =
        error.response?.data?.error || "Error creating user. Please try again.";
      setStatus({ loading: false, error: message, success: false });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 py-12 px-4">
      <div className="w-full bg-white shadow-lg rounded-lg p-6">
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
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
            {status.error}
          </div>
        )}
        {status.success && (
          <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">
            User created successfully!
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
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

          <div>
            <label className="block text-sm font-medium">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 w-full border px-3 py-2 rounded"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              required
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
              value={formData.password_confirmation}
              required
              onChange={handleChange}
              className="mt-1 w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium">Avatar</label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleChange}
              className="mt-1"
            />
            {avatarPreview && (
              <div className="mt-2 flex items-center space-x-4">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-full"
                />
                <button
                  type="button"
                  onClick={() => setAvatarPreview(null)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="col-span-1 lg:col-span-2 flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
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
