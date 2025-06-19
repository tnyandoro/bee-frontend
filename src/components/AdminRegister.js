import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import bg from "../assets/bg.png";
import logor from "../assets/logor.png";
import apiBaseUrl from "../config";

function AdminRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [username, setUsername] = useState("");
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (name) {
      const generatedSubdomain = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSubdomain(generatedSubdomain);
    }
  }, [name]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError("");

      try {
        const response = await axios.post(`${apiBaseUrl}/register`, {
          organization: {
            name,
            email,
            phone_number: phoneNumber,
            website,
            address,
            subdomain,
          },
          admin: {
            name: adminName,
            email,
            phone_number: phoneNumber,
            password,
            password_confirmation: passwordConfirmation,
            department,
            position,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          },
        });

        // Show success toast
        toast.success("Your organization has been successfully registered", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });

        localStorage.setItem("token", response.data.token);
        setTimeout(() => (window.location.href = "/admin/dashboard"), 2000);
      } catch (err) {
        const errorMessage =
          err.response?.data?.errors?.join(", ") ||
          err.response?.data?.error ||
          "Error during registration";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      name,
      email,
      phoneNumber,
      website,
      address,
      subdomain,
      adminName,
      password,
      passwordConfirmation,
      department,
      position,
      username,
    ]
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
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <hr className="w-full h-1 mx-auto my-4 bg-gray-100 border-0 rounded-sm md:my-10" />
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-6">
          {/* Organization Details */}
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-2xl mb-4 text-white font-bold">
              Organization Details
            </h2>
            <div className="mb-4">
              <label
                htmlFor="org-name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Organization Name
              </label>
              <input
                id="org-name"
                type="text"
                placeholder="Enter organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 w-full"
                required
              />
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
                type="text"
                placeholder="Enter subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="border p-2 w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="org-email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Organization Email
              </label>
              <input
                id="org-email"
                type="email"
                placeholder="Enter organization email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="phone-number"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone-number"
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border p-2 w-full"
                required
              />
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
                type="text"
                placeholder="Enter website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="border p-2 w-full"
                required
              />
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
                type="text"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                htmlFor="admin-name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Admin Name
              </label>
              <input
                id="admin-name"
                type="text"
                placeholder="Enter admin name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="border p-2 w-full"
                required
              />
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
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                }
                className="border p-2 w-full"
                required
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores allowed"
              />
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
                type="text"
                placeholder="Enter department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
                type="text"
                placeholder="Enter position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
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
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password-confirmation"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="password-confirmation"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="border p-2 w-full"
                required
              />
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
