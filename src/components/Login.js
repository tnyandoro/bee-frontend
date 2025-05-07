import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logor from "../assets/logor.png";
import bg from "../assets/main_bg.png";
import splashLogo from "../assets/splash_logo.png";

const Login = ({ loginType, setLoggedIn, setEmail, setRole }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    subdomain: "",
  });
  const [errors, setErrors] = useState({
    subdomain: "",
    email: "",
    password: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const splashTimeout = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      handleExistingSessionRedirect();
    }
  }, [navigate]);

  useEffect(() => {
    if (formData.subdomain) {
      setApiBaseUrl(`http://${formData.subdomain}.lvh.me:3000`);
    }
  }, [formData.subdomain]);

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

  const handleExistingSessionRedirect = () => {
    const storedSubdomain = localStorage.getItem("subdomain");
    const storedRole = localStorage.getItem("role");

    if (storedSubdomain && storedRole) {
      navigate(
        storedRole === "admin" || storedRole === "super_user"
          ? "/dashboard"
          : "/user/dashboard"
      );
    }
  };

  const validateForm = () => {
    const newErrors = {
      subdomain: "",
      email: "",
      password: "",
      general: "",
    };

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

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const { data } = await axios.post(
        `/api/v1/login`,
        {
          email: formData.email,
          password: formData.password,
          subdomain: formData.subdomain,
        },
        {
          baseURL: apiBaseUrl,
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!data.auth_token || !data.user?.role) {
        throw new Error("Invalid server response");
      }

      // Store authentication details
      localStorage.setItem("authToken", data.auth_token);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("subdomain", formData.subdomain);

      // Update parent component state
      setLoggedIn(true);
      setEmail(data.user.email);
      setRole(data.user.role);

      // Force full page reload to reset all states
      window.location.href =
        data.user.role === "admin" || data.user.role === "super_user"
          ? "/dashboard"
          : "/user/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      const errorStatus = error.response?.status;
      let errorMessage = "Login failed. Please try again";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please try again";
      } else if (errorStatus === 404) {
        errorMessage = "Organization not found";
      } else if (errorStatus === 401) {
        errorMessage = "Invalid credentials";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setErrors({
        subdomain: errorStatus === 404 ? errorMessage : "",
        password: errorStatus === 401 ? errorMessage : "",
        general: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash) {
    return (
      <div className="flex items-center justify-center bg-white h-screen">
        <img
          src={splashLogo}
          alt="Splash Logo"
          className="w-48 animate-pulse"
        />
      </div>
    );
  }

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
            {loginType} Login
          </h2>

          {errors.general && (
            <div className="text-red-500 mb-4 bg-red-100 p-2 rounded text-center">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                type="text"
                placeholder="e.g., syntatec"
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
                  errors.subdomain
                    ? "border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                disabled={isLoading}
                autoComplete="organization"
              />
              {errors.subdomain && (
                <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
              )}
            </div>

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
                placeholder="your@email.com"
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                value={formData.password}
                type="password"
                placeholder="••••••••"
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
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
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
