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

        // Fallback: if API returns array of strings, convert to label/value pair
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

        // Hardcoded fallback roles
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

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push("Email format is invalid");
    }

    if (!formData.username.trim()) {
      errors.push("Username is required");
    } else if (formData.username.includes("@")) {
      errors.push("Username should not be an email address");
    }

    if (!formData.password.trim()) {
      errors.push("Password is required");
    } else if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (!formData.password_confirmation.trim()) {
      errors.push("Password confirmation is required");
    } else if (formData.password !== formData.password_confirmation) {
      errors.push("Passwords must match");
    }

    if (formData.avatar) {
      if (formData.avatar.size > 5 * 1024 * 1024) {
        errors.push("Avatar file is too large (max 5MB)");
      } else if (!["image/jpeg", "image/png"].includes(formData.avatar.type)) {
        errors.push("Avatar must be JPEG or PNG");
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setStatus({
        loading: false,
        error: validationErrors.join(", "),
        success: false,
      });
      return;
    }

    if (!subdomain || !token) {
      setStatus({
        loading: false,
        error: !subdomain
          ? "Organization context missing - please refresh the page"
          : "Authentication token missing - please log in again",
        success: false,
      });
      return;
    }

    try {
      const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users`;
      const formDataToSend = new FormData();
      formDataToSend.append("user[name]", formData.name);
      formDataToSend.append("user[email]", formData.email);
      formDataToSend.append("user[username]", formData.username);
      formDataToSend.append("user[password]", formData.password);
      formDataToSend.append(
        "user[password_confirmation]",
        formData.password_confirmation
      );
      formDataToSend.append("user[role]", formData.role);
      if (formData.phone_number) {
        formDataToSend.append("user[phone_number]", formData.phone_number);
      }
      if (formData.position) {
        formDataToSend.append("user[position]", formData.position);
      }
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
      console.error("User creation error:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Error creating user. Please check all fields.";
      setStatus({ loading: false, error: errorMessage, success: false });
    }
  };

  const handleCancel = () => {
    onClose ? onClose() : navigate("/dashboard");
  };

  return (
    <div className="!w-full min-w-full h-screen overflow-y-auto bg-gray-100 pt-20 pb-8 px-4 sm:px-6 md:px-8">
      <div className="!w-full min-w-full max-w-full bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Create New User
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              aria-label="Close form"
            >
              ✕
            </button>
          )}
        </div>

        {status.error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm sm:text-base">
            {status.error}
          </div>
        )}

        {status.success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm sm:text-base">
            User created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username * (not an email)
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                required
                aria-required="true"
              />
              {formData.username.includes("@") && (
                <p className="mt-1 text-sm text-red-600">
                  Username should not be an email address
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="phone_number"
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                  aria-required="true"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Position
              </label>
              <input
                id="position"
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password * (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                required
                minLength={8}
                aria-required="true"
              />
              {formData.password && formData.password.length < 8 && (
                <p className="mt-1 text-sm text-red-600">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password *
              </label>
              <input
                id="password_confirmation"
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="avatar"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Avatar (Optional, PNG/JPEG, max 5MB)
              </label>
              <div className="flex items-center space-x-4">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Remove avatar"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Image
                  </div>
                )}
                <input
                  id="avatar"
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png"
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  aria-describedby="avatar-help"
                />
              </div>
              <p id="avatar-help" className="mt-1 text-sm text-gray-500">
                Upload a JPEG or PNG image (max 5MB).
              </p>
              {formData.avatar &&
                (formData.avatar.size > 5 * 1024 * 1024 ||
                  !["image/jpeg", "image/png"].includes(
                    formData.avatar.type
                  )) && (
                  <p className="mt-1 text-sm text-red-600">
                    {formData.avatar.size > 5 * 1024 * 1024
                      ? "Avatar file is too large (max 5MB)"
                      : "Avatar must be JPEG or PNG"}
                  </p>
                )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-base sm:text-lg"
              aria-label="Cancel and close form"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center text-base sm:text-lg"
            >
              {status.loading && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              )}
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
