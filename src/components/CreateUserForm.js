import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";

const CreateUserForm = ({ onClose }) => {
  const { currentUser, token, subdomain } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone_number: "",
    department: "",
    position: "",
    role: "agent",
    password: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  useEffect(() => {
    console.log("Current auth context:", { subdomain, token });
  }, [subdomain, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Enhanced error message extraction function
  const extractErrorMessage = (error) => {
    console.log("Complete error response:", error.response?.data);

    if (!error.response) {
      return "Network error. Please check your connection and try again.";
    }

    const { data } = error.response;

    // Handle string error directly
    if (typeof data?.error === "string") {
      return data.error;
    }

    // Handle array of error messages
    if (data?.error && Array.isArray(data.error)) {
      return data.error.join(", ");
    }

    // Handle nested error object
    if (data?.error && typeof data.error === "object") {
      // Try to extract messages from the nested object
      const messages = [];
      Object.entries(data.error).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          messages.push(`${key}: ${value.join(", ")}`);
        } else if (typeof value === "string") {
          messages.push(`${key}: ${value}`);
        }
      });

      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    // Handle object with details field
    if (data?.details) {
      return typeof data.details === "string"
        ? data.details
        : "Server error. Please try again or contact support.";
    }

    // Fallback for any other error format
    return "Error creating user. Please check all fields and try again.";
  };

  // Client-side validation
  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push("Name is required");
    }

    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push("Email format is invalid");
    }

    if (!formData.username.trim()) {
      errors.push("Username is required");
    } else if (formData.username.includes("@")) {
      // Username should not be an email address
      errors.push("Username should not be an email address");
    }

    if (!formData.password.trim()) {
      errors.push("Password is required");
    } else if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    // Perform client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setStatus({
        loading: false,
        error: validationErrors.join(", "),
        success: false,
      });
      return;
    }

    if (!subdomain) {
      setStatus({
        loading: false,
        error: "Organization context missing - please refresh the page",
        success: false,
      });
      return;
    }

    if (!token) {
      setStatus({
        loading: false,
        error: "Authentication token missing - please log in again",
        success: false,
      });
      return;
    }

    try {
      const url = `http://lvh.me:3000/api/v1/organizations/${subdomain}/users`;
      console.log("Submitting with token:", token);
      console.log("Request payload:", formData);

      await axios.post(
        url,
        { user: formData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setStatus({
        loading: false,
        success: true,
        error: null,
      });

      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          username: "",
          phone_number: "",
          department: "",
          position: "",
          role: "agent",
          password: "",
        });
        onClose();
      }, 2000);
    } catch (error) {
      console.log("Request payload:", formData);
      console.log("Complete error response:", error.response?.data);
      console.error("User creation error:", error);

      const errorMessage = extractErrorMessage(error);

      setStatus({
        loading: false,
        error: errorMessage,
        success: false,
      });
    }
  };

  const getAvailableRoles = () => {
    const baseRoles = ["agent", "viewer"];
    if (currentUser?.is_admin) {
      const adminRoles = [...baseRoles, "team_lead"];
      if (currentUser?.role === "super_user") {
        return [...adminRoles, "admin", "super_user"];
      }
      return adminRoles;
    }
    return baseRoles;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create New User</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {status.error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {status.error}
        </div>
      )}

      {status.success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
          User created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username * (not an email address)
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {formData.username.includes("@") && (
              <p className="mt-1 text-sm text-red-600">
                Username should not be an email address
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {getAvailableRoles().map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password * (minimum 8 characters)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={8}
            />
            {formData.password && formData.password.length < 8 && (
              <p className="mt-1 text-sm text-red-600">
                Password must be at least 8 characters
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={status.loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
  );
};

export default CreateUserForm;
