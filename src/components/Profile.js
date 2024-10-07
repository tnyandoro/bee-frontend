import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = ({ userId, organizationId }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`/api/v1/organizations/${organizationId}/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError('Failed to load user profile');
      }
    };

    fetchUserProfile();
  }, [userId, organizationId]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="bg-gray-100 p-5 rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-3">User Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <img src={user.profileImage || '/path/to/default-avatar.png'} alt="Profile" className="w-20 h-20 rounded-full mt-3" />
    </div>
  );
};

export default Profile;
