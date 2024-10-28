import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import { FaUpload, FaLock, FaUser, FaArrowLeft } from 'react-icons/fa';

const Profile = () => {
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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

    const storedImage = localStorage.getItem('profilePicture');
    if (storedImage) {
      setProfilePicture(storedImage);
    }
  }, []);

  const handleImageUpload = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        setProfilePicture(imageUrl);
        localStorage.setItem('profilePicture', imageUrl);
      };
      reader.readAsDataURL(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword) {
      alert('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    } else {
      alert('Passwords do not match!');
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="bg-gray-300 p-5 mt-10 flex">
      {/* Vertical Menu */}
      <div className="bg-blue-700 p-4 rounded-l-lg text-white w-1/4">
        <div className="p-2 mx-auto rounded-b-lg bg-blue-700 shadow-5xl mb-6 mt-10">
          <h2 className="text-xl mb-6">My Profile</h2>
        </div>

        {/* Profile Picture and Upload Button as part of Menu */}
        <div className="flex flex-col items-center mr-10 mb-4">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-blue-500 mb-2"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-blue-500 bg-white shadow flex items-center justify-center mb-2">
              Upload Picture
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setSelectedFile(e.target.files[0]);
              handleImageUpload();
            }}
            className="hidden"
            id="file-upload"
          />
        </div>

        {/* Menu Buttons */}
        <label 
          htmlFor="file-upload" 
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
        >
          <FaUpload className="mr-2" /> Upload Picture
        </label>
        <label
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
          onClick={() => setActiveTab('profile')}
        >
          <FaUser className="mr-2" /> My Profile
        </label>
        <label
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
          onClick={() => setActiveTab('settings')}
        >
          <FaLock className="mr-2" /> Change Password
        </label>
        <label
          className="flex items-center py-2 px-4 mb-2 bg-blue-700 hover:bg-blue-600 rounded cursor-pointer transition"
          onClick={() => alert('Profile updated!')}
        >
          <FaArrowLeft className="mr-2" /> Update Profile
        </label>
      </div>

      {/* Main Profile Content */}
      <div className="flex-1 p-4">
        {activeTab === 'profile' ? (
          <div>
            <div className="p-2 mt-6">
              {error && <p className="text-red-500">{error}</p>}
            </div>

            {/* User Details */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ID', value: profile.user.id || 'N/A' },
                { key: 'Full Name', value: profile.user.name || 'N/A' },
                { key: 'Password', value: '*********' },
                { key: 'Email', value: profile.user.email || 'N/A' },
                { key: 'Username', value: profile.user.username || 'N/A' },
                { key: 'Phone', value: profile.user.phone_number || 'N/A' },
                { key: 'Department', value: profile.user.department || 'N/A' },
                { key: 'Position', value: profile.user.position || 'N/A' },
                { key: 'Organization ID', value: profile.user.organization_id || 'N/A' },
                { key: 'Organization Name', value: profile.user.organization_name || 'N/A' },
                { key: 'Assignment Group ID', value: profile.user.assignment_group_id || 'N/A' },
                { key: 'Created At', value: new Date(profile.user.created_at).toLocaleDateString() || 'N/A' },
                { key: 'Updated At', value: new Date(profile.user.updated_at).toLocaleDateString() || 'N/A' },
                { key: 'Role', value: isAdmin ? 'Admin' : 'User' },
              ].map(({ key, value }, index) => (
                <div key={index} className="flex flex-col items-start mb-2">
                  <div className="font-bold text-lg">{key}</div>
                  <div className="border border-blue-500 bg-white p-2 w-full text-lg text-left">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-2 border rounded mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-2 border rounded mb-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleChangePassword}
            >
              Change Password
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Profile;
