import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext"; // Import useAuth
import axios from "axios";
import { toast } from "react-toastify";
import bg from "../assets/bg.png";
import logor from "../assets/logor.png";
import apiBaseUrl from "../config";

function AdminRegister() {
  const { login } = useAuth(); // Use login from AuthContext
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    website: "",
    address: "",
    subdomain: "",
    password: "",
    passwordConfirmation: "",
    department: "",
    position: "",
    username: "",
    adminName: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (formData.name) {
      const generatedSubdomain = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, subdomain: generatedSubdomain }));
    }
  }, [formData.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "subdomain"
          ? value
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "")
              .trim()
          : name === "username"
          ? value.toLowerCase().replace(/[^a-z0-9_]/g, "")
          : value.trim(),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Organization name is required";
    if (!formData.subdomain) newErrors.subdomain = "Subdomain is required";
    else if (!/^[a-z0-9-]{3,}$/.test(formData.subdomain))
      newErrors.subdomain =
        "Invalid subdomain format (min 3 chars, alphanumeric or hyphens)";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.website) newErrors.website = "Website is required";
    if (!formData.adminName) newErrors.adminName = "Admin name is required";
    if (!formData.username) newErrors.username = "Username is required";
    else if (!/^[a-z0-9_]{3,}$/.test(formData.username))
      newErrors.username =
        "Invalid username format (min 3 chars, alphanumeric or underscores)";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.passwordConfirmation)
      newErrors.passwordConfirmation = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting || !validateForm()) return;
      setIsSubmitting(true);

      console.log("apiBaseUrl:", apiBaseUrl);
      console.log("Full URL:", `${apiBaseUrl}/register`);

      try {
        const response = await axios.post(
          `http://lvh.me:3000/api/v1/register`,
          {
            organization: {
              name: formData.name,
              email: formData.email,
              phone_number: formData.phoneNumber,
              website: formData.website,
              address: formData.address,
              subdomain: formData.subdomain,
            },
            admin: {
              name: formData.adminName,
              email: formData.email,
              phone_number: formData.phoneNumber,
              password: formData.password,
              password_confirmation: formData.passwordConfirmation,
              department: formData.department,
              position: formData.position,
              username: formData.username,
            },
          }
        );

        // Log in the admin user using useAuth
        await login(formData.email, formData.password, formData.subdomain);

        toast.success("Your organization has been successfully registered", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });

        navigate("/admin/dashboard");
      } catch (err) {
        const errorMessage =
          err.response?.data?.errors?.join(", ") ||
          err.response?.data?.error ||
          "Error during registration";
        setErrors({ general: errorMessage });
        console.error("Request Error:", err.response);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, formData, login, navigate]
  );

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="p-8 bg-blue-400 bg-opacity-90 rounded shadow-md w-full max-w-4xl">
        <div className="bg-white flex flex-col w-full rounded-xl items-center p-4">
          <img src={logor} alt="Logo" className="w-40 lg:w-80 m-4" />
        </div>
        <h1 className="m-4 text-3xl text-center text-white">
          Welcome to the Admin Registration Page
        </h1>
        {errors.general && (
          <p className="text-red-500 mb-4 text-center">{errors.general}</p>
        )}
        <hr className="w-full h-1 mx-auto my-4 bg-gray-100 border-0 rounded-sm md:my-10" />
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-6">
          {/* Organization Details */}
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-2xl mb-4 text-white font-bold">
              Organization Details
            </h2>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Organization Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter organization name"
                value={formData.name}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.name ? "border-red-500" : ""
                }`}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="subdomain"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Subdomain (Generated)
              </label>
              <input
                id="subdomain"
                name="subdomain"
                type="text"
                placeholder="Enter subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.subdomain ? "border-red-500" : ""
                }`}
                required
              />
              {errors.subdomain && (
                <p className="text-red-500 text-sm">{errors.subdomain}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Organization Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter organization email"
                value={formData.email}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.email ? "border-red-500" : ""
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.phoneNumber ? "border-red-500" : ""
                }`}
                required
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Website (Required)
              </label>
              <input
                id="website"
                name="website"
                type="text"
                placeholder="Enter website"
                value={formData.website}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.website ? "border-red-500" : ""
                }`}
                required
              />
              {errors.website && (
                <p className="text-red-500 text-sm">{errors.website}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Address (Optional)
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Enter address"
                value={formData.address}
                onChange={handleChange}
                className="border p-2 w-full"
              />
            </div>
          </div>

          {/* Admin Details */}
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-2xl mb-4 text-white font-bold">
              Admin Details
            </h2>
            <div className="mb-4">
              <label
                htmlFor="adminName"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Admin Name
              </label>
              <input
                id="adminName"
                name="adminName"
                type="text"
                placeholder="Enter admin name"
                value={formData.adminName}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.adminName ? "border-red-500" : ""
                }`}
                required
              />
              {errors.adminName && (
                <p className="text-red-500 text-sm">{errors.adminName}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.username ? "border-red-500" : ""
                }`}
                required
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores allowed"
              />
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Department (Optional)
              </label>
              <input
                id="department"
                name="department"
                type="text"
                placeholder="Enter department"
                value={formData.department}
                onChange={handleChange}
                className="border p-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Position (Optional)
              </label>
              <input
                id="position"
                name="position"
                type="text"
                placeholder="Enter position"
                value={formData.position}
                onChange={handleChange}
                className="border p-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.password ? "border-red-500" : ""
                }`}
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="passwordConfirmation"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={formData.passwordConfirmation}
                onChange={handleChange}
                className={`border p-2 w-full ${
                  errors.passwordConfirmation ? "border-red-500" : ""
                }`}
                required
              />
              {errors.passwordConfirmation && (
                <p className="text-red-500 text-sm">
                  {errors.passwordConfirmation}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-gray-200 underline"
            >
              {showPassword ? "Hide Passwords" : "Show Passwords"}
            </button>
          </div>

          <div className="w-full">
            <button
              type="submit"
              className={`bg-white text-blue-500 rounded p-2 w-full ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-300"
              } transition-colors`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminRegister;
