import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const CreateUserForm = ({ onClose }) => {
  const { currentUser, token, subdomain } = useAuth();
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
    if (!formData.email.trim()) errors.push("Email is required");
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.push("Invalid email format");

    if (!formData.username.trim()) errors.push("Username is required");
    else if (formData.username.includes("@"))
      errors.push("Username should not be an email");

    if (!formData.password.trim()) errors.push("Password is required");
    else if (formData.password.length < 8)
      errors.push("Password must be at least 8 characters");

    if (!formData.password_confirmation.trim())
      errors.push("Password confirmation is required");
    else if (formData.password !== formData.password_confirmation)
      errors.push("Passwords do not match");

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

    if (!subdomain) {
      setStatus({
        loading: false,
        error: "Organization subdomain is missing. Try refreshing the page.",
        success: false,
      });
      return;
    }

    if (!token) {
      setStatus({
        loading: false,
        error: "Authentication token missing. Please log in again.",
        success: false,
      });
      return;
    }

    try {
      const url = `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/users`;

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(`user[${key}]`, value);
      });
      formDataToSend.append("organization_subdomain", subdomain);

      const response = await axios.post(url, formDataToSend, {
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
      }, 2000);
    } catch (error) {
      console.error("User creation error:", error);

      const errorMessage = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join(" | ")
        : error.response?.data?.error ||
          "Error creating user. Please try again.";

      setStatus({ loading: false, error: errorMessage, success: false });
    }
  };

  const handleCancel = () => {
    if (onClose) onClose();
    else navigate("/dashboard");
  };

  const roleOptions = [
    { value: "service_desk_agent", label: "Service Desk Agent" },
    { value: "level_1_2_support", label: "Level 1/2 Support" },
    { value: "team_leader", label: "Team Leader" },
    { value: "level_3_support", label: "Level 3 Support" },
    { value: "incident_manager", label: "Incident Manager" },
    { value: "problem_manager", label: "Problem Manager" },
    { value: "problem_coordinator", label: "Problem Coordinator" },
    { value: "change_manager", label: "Change Manager" },
    { value: "change_coordinator", label: "Change Coordinator" },
    { value: "department_manager", label: "Department Manager" },
    { value: "general_manager", label: "General Manager" },
    { value: "system_admin", label: "System Admin" },
    { value: "domain_admin", label: "Domain Admin" },
  ];

  return (
    <div className="w-full h-screen overflow-y-auto bg-gray-100 pt-20 pb-8 px-4 sm:px-6 md:px-8">
      <div className="max-w-full bg-white rounded-lg shadow-xl p-6 sm:p-8">
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

        {/* Form fields omitted for brevity; you can paste from your working form here */}
        {/* The key change here is to ensure the `handleSubmit` logic is updated */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Keep your full form UI fields here */}
          {/* All `input` and `select` fields remain unchanged from your version */}
          {/* Buttons remain the same as well */}
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
