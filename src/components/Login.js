import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { toast } from "react-toastify";
import logor from "../assets/logor.png";
import bg from "../assets/main_bg.png";
import splashLogo from "../assets/splash_logo.png";

const Login = ({ loginType = "User" }) => {
  const { login, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    subdomain: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const splashTimeout = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (currentUser) {
      redirectAfterLogin(currentUser.role);
    }
  }, [currentUser]);

  const sanitizeSubdomain = (input) =>
    input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "subdomain" ? sanitizeSubdomain(value) : value.trim(),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subdomain)
      newErrors.subdomain = "Organization subdomain is required";
    else if (!/^[a-z0-9-]{3,}$/.test(formData.subdomain))
      newErrors.subdomain =
        "Invalid subdomain format (min 3 chars, alphanumeric or hyphens)";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const redirectAfterLogin = (role) => {
    if (role === "system_admin" || role === "domain_admin")
      navigate("/dashboard");
    else navigate("/user/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const success = await login(
        formData.email,
        formData.password,
        formData.subdomain
      );
      if (success) {
        toast.success("You have successfully logged in", {
          position: "top-right",
          autoClose: 6000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        // navigation happens automatically in useEffect when currentUser updates
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general:
          error.message ||
          "Login failed. Please check your credentials and try again.",
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
                required
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
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="foobar text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  value={formData.password}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm pr-10 focus:outline-none ${
                    errors.password
                      ? "border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 px-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20C6.477 20 2 12 2 12a16.9 16.9 0 0 1 5.06-5.94" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm sm:text-base text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Forgot your password?"
                >
                  Forgot Password?
                </Link>
              </div>
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
