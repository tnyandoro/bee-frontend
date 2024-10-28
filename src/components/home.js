import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logor.png'; // Make sure the file exists in this path
import backgroundImage from '../assets/landing.jpg'; // Make sure the file exists in this path

// Fallback image URLs
const fallbackLogo = 'https://via.placeholder.com/150?text=Logo'; // Replace with a real fallback image URL if needed
const fallbackBackgroundImage = 'https://via.placeholder.com/1920x1080?text=Background'; // Replace with a real fallback image URL if needed

const Home = (props) => {
  const { loggedIn } = props;
  const navigate = useNavigate();

  const onButtonClick = () => {
    if (loggedIn) {
      // Logic for logging out (if applicable)
    } else {
      navigate('/admin/login'); // Navigate to the login page
    }
  };

  const handleGetStarted = () => {
    navigate('/admin/register'); // Navigate to the register page
  };

  return (
    <div
      className="relative flex flex-col items-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage || fallbackBackgroundImage})` }}
    >
      {/* Gray overlay with reduced opacity for better contrast */}
      <div className="absolute inset-0 bg-gray-900 opacity-40 z-0"></div>

      {/* Content container with logo, text, and buttons */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] w-full px-4">
        {/* Logo Section */}
        <img
          src={logo || fallbackLogo}
          alt="Resolve 360 Logo"
          className="w-96 mb-6 brightness-125" // Added brightness utility
        />

        {/* White Description Text */}
        <p className="text-2xl text-white mb-8 text-center max-w-2xl">
          A comprehensive IT Service Management platform to streamline your operations.
        </p>

        {/* Call to Action Button */}
        <button
          onClick={onButtonClick}
          className="bg-blue-700 text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-blue-800 transition duration-300 mb-4"
        >
          {loggedIn ? 'Log out' : 'Log in'}
        </button>

        {/* Get Started Button */}
        <button
          onClick={handleGetStarted}
          className="bg-green-700 text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-green-800 transition duration-300"
        >
          Get Started
        </button>
      </div>

      {/* Informational Cards Section */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16 px-4 ">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-bold mb-4">What is ITSM?</h3>
          <p className="text-gray-700">
            IT Service Management (ITSM) refers to the way IT is managed in an organization, focusing on the delivery of IT services to customers.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-bold mb-4">Why ITSM?</h3>
          <p className="text-gray-700">
            ITSM helps organizations align IT services with business needs, enhancing efficiency, customer satisfaction, and overall performance.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-bold mb-4">How Our ITSM Can Help?</h3>
          <p className="text-gray-700">
            Our ITSM platform streamlines processes, improves collaboration, and increases visibility, ensuring your organization runs smoothly and effectively.
          </p>
        </div>
      </div>

      {/* Footer Section */}
      {loggedIn && (
        <div className="relative z-10 mt-6 text-gray-300">
          Logged in as: <span className="font-semibold">{props.email}</span>
        </div>
      )}
    </div>
  );
};

export default Home;
