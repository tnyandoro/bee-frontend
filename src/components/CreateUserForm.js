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
          headers: { Authorization: `Bearer ${token}` },
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
    if (subdomain && token) fetchRoles();
  }, [subdomain, token]);

  useEffect(
    () => () => avatarPreview && URL.revokeObjectURL(avatarPreview),
    [avatarPreview]
  );

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

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.push("Invalid email");
    if (!formData.username.trim()) errors.push("Username is required");
    else if (formData.username.includes("@"))
      errors.push("Username should not be an email");
    if (!formData.password || formData.password.length < 8)
      errors.push("Password must be at least 8 characters");
    if (formData.password !== formData.password_confirmation)
      errors.push("Passwords must match");
    if (formData.avatar) {
      if (formData.avatar.size > 5 * 1024 * 1024)
        errors.push("Avatar too large");
      else if (!["image/jpeg", "image/png"].includes(formData.avatar.type))
        errors.push("Invalid avatar type");
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });
    const errors = validateForm();
    if (errors.length > 0) {
      setStatus({ loading: false, error: errors.join(", "), success: false });
      return;
    }
    try {
      const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users`;
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val) data.append(`user[${key}]`, val);
      });
      data.append("organization_subdomain", subdomain);
      await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setStatus({ loading: false, error: null, success: true });
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
        onClose?.();
      }, 1500);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.error || "Failed to create user",
        success: false,
      });
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gray-100 py-10 px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Create New User
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none p-1"
            >
              ✕
            </button>
          )}
        </div>
        {status.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {status.error}
          </div>
        )}
        {status.success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            User created!
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input fields */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="tel"
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="position"
            placeholder="Position"
            value={formData.position}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            name="password_confirmation"
            placeholder="Confirm Password"
            value={formData.password_confirmation}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="file"
            name="avatar"
            accept="image/jpeg,image/png"
            onChange={handleChange}
            className="w-full"
          />
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="avatar preview"
              className="w-24 h-24 object-cover rounded-full"
            />
          )}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
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
