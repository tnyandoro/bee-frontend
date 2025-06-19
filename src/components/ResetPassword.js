import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import bg from "../assets/main_bg.png";
import logor from "../assets/logor.png";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    subdomain: "",
    password: "",
    passwordConfirmation: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    subdomain: "",
    password: "",
    general: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const sanitizeSubdomain = (input) => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "subdomain" ? sanitizeSubdomain(value) : value,
    }));
  };

  const getBaseURL = () => {
    const fromForm = formData.subdomain;
    const fromStorage = localStorage.getItem("subdomain");
    const fromHost = window.location.hostname.split(".")[0];
    const subdomain = fromForm || fromStorage || fromHost || "app";
    return `http://${subdomain}.lvh.me:3000`;
  };

  const validateForgotPassword = () => {
    const newErrors = { email: "", subdomain: "", password: "", general: "" };
    if (!formData.subdomain.trim()) {
      newErrors.subdomain = "Organization subdomain is required";
    } else if (!/^[a-z0-9-]{3,}$/.test(formData.subdomain)) {
      newErrors.subdomain =
        "Invalid subdomain format (min 3 chars, alphanumeric or hyphens)";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const validateResetPassword = () => {
    const newErrors = { email: "", subdomain: "", password: "", general: "" };
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.passwordConfirmation) {
      newErrors.password = "Passwords do not match";
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateForgotPassword()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      await axios.post(
        `/api/v1/password/reset`,
        {
          email: formData.email,
          subdomain: formData.subdomain,
        },
        {
          baseURL: getBaseURL(),
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success("Password reset email sent. Please check your inbox.", {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: true,
        theme: "light",
      });

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to send reset email.";
      setErrors((prev) => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: true,
        theme: "light",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateResetPassword()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      await axios.post(
        `/api/v1/password/update`,
        {
          token,
          password: formData.password,
          password_confirmation: formData.passwordConfirmation,
        },
        {
          baseURL: getBaseURL(),
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success("Password updated successfully. Redirecting to login...", {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: true,
        theme: "light",
      });

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to update password.";
      setErrors((prev) => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: true,
        theme: "light",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="flex flex-col items-center justify-center bg-gray-200/90 w-full lg:w-1/2 p-4">
        <img src={logor} alt="Logo" className="w-40 lg:w-80 mb-6" />
        <h1 className="text-xl font-semibold text-gray-800">
          IT Service Management Platform
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-4 bg-black/30">
        <div className="w-full max-w-md bg-white/90 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">
            {token ? "Reset Your Password" : "Forgot Password"}
          </h2>

          {errors.general && (
            <div className="text-red-500 mb-4 bg-red-100 p-2 rounded text-center">
              {errors.general}
            </div>
          )}

          <form
            onSubmit={token ? handleResetPassword : handleForgotPassword}
            className="space-y-4"
          >
            {!token && (
              <>
                {/* Subdomain Field */}
                <div>
                  <label
                    htmlFor="subdomain"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Organization Subdomain
                  </label>
                  <input
                    id="subdomain"
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder="e.g., syntatec"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      errors.subdomain
                        ? "border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    disabled={isLoading}
                    autoComplete="organization"
                  />
                  {errors.subdomain && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.subdomain}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    value={formData.email}
                    type="email"
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      errors.email
                        ? "border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </>
            )}

            {token && (
              <>
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      errors.password
                        ? "border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirm Password
                  </label>
                  <input
                    name="passwordConfirmation"
                    type="password"
                    value={formData.passwordConfirmation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 rounded-md text-white ${
                  isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : token ? (
                  "Reset Password"
                ) : (
                  "Send Reset Email"
                )}
              </button>
            </div>
          </form>

          {!token && (
            <div className="mt-4 text-center">
              <a
                href="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Back to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
