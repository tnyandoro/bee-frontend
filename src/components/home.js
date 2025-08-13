import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext"; // Corrected path and case
import logo from "../assets/logor.png";
import backgroundImage from "../assets/landing.jpg";

// Fallback image URLs
const fallbackLogo = "https://via.placeholder.com/150?text=Logo";
const fallbackBackgroundImage =
  "https://via.placeholder.com/1920x1080?text=Background";

const Home = () => {
  const { currentUser, loading, logout } = useAuth();
  const navigate = useNavigate();

  const onButtonClick = () => {
    if (currentUser) {
      logout();
      navigate("/"); // Stay on home page after logout
    } else {
      navigate("/login"); // Navigate to login page
    }
  };

  const handleGetStarted = () => {
    navigate("/admin/register");
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div
      className="relative flex flex-col items-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImage || fallbackBackgroundImage})`,
      }}
    >
      {/* Gray overlay */}
      <div className="absolute inset-0 bg-gray-900 opacity-40 z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] w-full px-4">
        <img
          src={logo || fallbackLogo}
          alt="Resolve 360 Logo"
          className="w-96 mb-6 brightness-125"
        />

        <p className="text-2xl text-white mb-8 text-center max-w-2xl">
          A comprehensive IT Service Management platform to streamline your
          operations.
        </p>

        <button
          onClick={onButtonClick}
          className="bg-blue-700 text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-blue-800 transition duration-300 mb-4"
        >
          {currentUser ? "Log out" : "Log in"}
        </button>
        <button
          onClick={handleGetStarted}
          className="bg-green-700 text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-green-800 transition duration-300"
        >
          Get Started
        </button>
      </div>

      {/* Informational Cards ping */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-bold mb-4">What is ITSM?</h3>
          <p className="text-gray-700">
            IT Service Management (ITSM) refers to the way IT is managed in an
            organization, focusing on the delivery of IT services to customers.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-bold mb-4">Why ITSM?</h3>
          <p className="text-gray-700">
            ITSM helps organizations align IT services with business needs,
            enhancing efficiency, customer satisfaction, and overall
            performance.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-bold mb-4">How Our ITSM Can Help?</h3>
          <p className="text-gray-700">
            Our ITSM platform streamlines processes, improves collaboration, and
            increases visibility, ensuring your organization runs smoothly and
            effectively.
          </p>
        </div>
      </div>

      {/* Footer */}
      {currentUser && (
        <div className="relative z-10 mt-6 text-gray-300">
          Logged in as:{" "}
          <span className="font-semibold">{currentUser.email}</span>
        </div>
      )}
    </div>
  );
};

export default Home;
