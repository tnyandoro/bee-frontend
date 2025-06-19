import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logor from "../assets/logor.png";
import profileImage from "../assets/tendy.jpg";

const Navbar = ({
  name,
  email,
  role,
  loggedIn,
  onLogout,
  organizationName,
  subdomain,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    toast.success("You have successfully logged out", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
    });
    navigate("/");
  };

  if (!loggedIn) return null;

  return (
    <nav className="bg-slate-50 text-gray-800 p-4 flex justify-between items-center shadow-lg fixed top-0 left-0 right-0 z-50 border-b-4 border-blue-500 mb-20">
      {/* Left Section: Logo and Organization Name */}
      <div className="flex items-center">
        <img src={logor} alt="Logo" className="h-12 mr-3" />
        <span className="text-xl font-bold text-black">{organizationName}</span>
      </div>

      {/* Mobile Menu Icon */}
      <div className="md:hidden flex items-center">
        <button
          onClick={toggleMobileMenu}
          className="focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {/* Right Section: User Info */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Notification Icon */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.5 14.5V11a6.5 6.5 0 10-13 0v3.5a2.032 2.032 0 01-.095.595L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-0 right-0 block h-2 w-2 bg-red-600 rounded-full"></span>
        </div>

        {/* User Information */}
        <div className="text-right">
          <p className="font-medium">{name || email}</p>
          <p className="font-bold text-black">{subdomain}</p>
          <p className="text-sm text-gray-300">{role}</p>
        </div>

        {/* User Profile Image - with dropdown */}
        <div className="relative">
          <img
            src={profileImage}
            alt="User Profile"
            className="h-10 w-10 rounded-full border-2 border-white cursor-pointer object-cover"
            onClick={toggleDropdown}
          />

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
              <button
                onClick={handleProfileClick}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                aria-label="Go to Profile"
              >
                Profile
              </button>
              <button
                onClick={handleLogoutClick}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg z-40">
          <div className="flex flex-col items-start p-4">
            <button
              onClick={handleProfileClick}
              className="py-2 px-4 w-full text-left text-gray-700 hover:bg-gray-100"
              aria-label="Mobile Profile"
            >
              Profile
            </button>
            <button
              onClick={handleLogoutClick}
              className="py-2 px-4 w-full text-left text-gray-700 hover:bg-gray-100"
              aria-label="Mobile Logout"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
