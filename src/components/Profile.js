import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext'; // Ensure correct path

const Profile = () => {
  const { currentUser, isAdmin } = useAuth(); // Ensure isAdmin is part of your context state
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/auth/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setProfile(response.data);
      } catch (err) {
        setError('Failed to fetch profile data. Please try again.');
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <div className="text-center text-gray-600 mt-12">Loading profile...</div>;
  }

  // Organization name should always be available
  const organizationName = profile.user.organization_name || 'N/A';
  const fullName = profile.user.full_name || profile.user.name || 'N/A'; // Fallback to 'N/A' if full name is missing
  const role = isAdmin ? 'Admin' : (profile.user.role === 'admin' ? 'Admin' : 'User'); // Handle role correctly

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* Window Header */}
      <div className="bg-blue-600 w-full max-w-2xl text-white p-3 rounded-t-lg shadow-md flex justify-between items-center">
        <h1 className="text-lg font-semibold">User Profile</h1>
        <button className="px-2 py-1 bg-gray-100 text-blue-600 rounded hover:bg-gray-300">
          Close
        </button>
      </div>

      {/* Profile Content Window */}
      <div className="w-full max-w-2xl bg-white rounded-b-lg shadow-lg p-6 border-t-4 border-blue-600">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <div className="space-y-4">
          <p className="text-gray-800">
            <strong>Full Name:</strong> {fullName} {/* Display full name */}
          </p>
          <p className="text-gray-800">
            <strong>Email:</strong> {profile.user.email}
          </p>
          <p className="text-gray-800">
            <strong>Department:</strong> {profile.user.department}
          </p>
          <p className="text-gray-800">
            <strong>Position:</strong> {profile.user.position}
          </p>
          <p className="text-gray-800">
            <strong>Phone:</strong> {profile.user.phone_number}
          </p>
          <p className="text-gray-800">
            <strong>Role:</strong> {role} {/* Correct role handling */}
          </p>
          <p className="text-gray-800">
            <strong>Organization:</strong> {organizationName} {/* Show organization name or fallback */}
          </p>
        </div>
        
        {/* Bottom border with Windows-style button */}
        <div className="mt-6 flex justify-end space-x-3">
          <button className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-800 rounded hover:bg-gray-200 shadow-sm">
            Edit Profile
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
