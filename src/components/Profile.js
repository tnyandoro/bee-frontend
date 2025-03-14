import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import { FaUpload, FaLock, FaUser, FaArrowLeft } from 'react-icons/fa';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      const subdomain = localStorage.getItem('subdomain');

      if (!token || !subdomain) {
        setError('Please log in to view your profile.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://${subdomain}.lvh.me:3000/api/v1/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Profile response:', response.data);
        setProfile(response.data);
      } catch (err) {
        setError('Failed to fetch profile data: ' + (err.response?.data?.error || err.message));
        console.error('Profile fetch error:', err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const storedImage = localStorage.getItem('profilePicture');
    if (storedImage) {
      setProfilePicture(storedImage);
    }

    console.log('Current user from context:', user);
  }, [user]);

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
      // TODO: Implement password change API call
      alert('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    } else {
      alert('Passwords do not match!');
    }
  };

  console.log('Profile state:', profile); // Debug profile state

  if (loading) {
    return <div className="p-4">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="p-4">No profile data available.</div>;
  }

  const userData = profile.user || {};
  const isAdmin = userData.role === 'admin' || userData.role === 'super_user';

  return (
    <div className="bg-gray-300 p-5 mt-10 flex">
      <div className="bg-blue-700 p-4 rounded-l-lg text-white w-1/4">
        <div className="p-2 mx-auto rounded-b-lg bg-blue-700 shadow-5xl mb-6 mt-10">
          <h2 className="text-xl mb-6">My Profile</h2>
        </div>

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
          onClick={() => alert('Profile updated!')} // TODO: Implement update logic
        >
          <FaArrowLeft className="mr-2" /> Update Profile
        </label>
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'profile' ? (
          <div>
            <div className="p-2 mt-6">
              {error && <p className="text-red-500">{error}</p>}
              {isAdmin && <p className="text-green-500">You have admin privileges.</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ID', value: userData.id || 'N/A' },
                { key: 'Full Name', value: userData.name || 'N/A' },
                { key: 'Password', value: '*********' },
                { key: 'Email', value: userData.email || 'N/A' },
                { key: 'Username', value: userData.username || 'N/A' },
                { key: 'Phone', value: userData.phone_number || 'N/A' },
                { key: 'Department', value: userData.department || 'N/A' },
                { key: 'Position', value: userData.position || 'N/A' },
                { key: 'Organization ID', value: profile.organization?.id || 'N/A' },
                { key: 'Organization Name', value: profile.organization?.name || 'N/A' },
                { key: 'Team ID', value: userData.team_id || 'N/A' },
                { key: 'Role', value: userData.role || 'N/A' },
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