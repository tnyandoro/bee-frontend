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
    return <div>Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold">User Profile</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white shadow rounded-lg p-6 mt-4">
        <p><strong>Full Name:</strong> {profile.user.first_name} {profile.user.last_name}</p>
        <p><strong>Email:</strong> {profile.user.email}</p>
        <p><strong>Name:</strong> {profile.user.name}</p>
        <p><strong>Department:</strong> {profile.user.department}</p>
        <p><strong>Position:</strong> {profile.user.position}</p>
        <p><strong>Phone:</strong> {profile.user.phone_number}</p>
        <p><strong>Role:</strong> {isAdmin ? 'Admin' : 'User'}</p>
        {/* Display any additional fields as necessary */}
      </div>
    </div>
  );
};

export default Profile;
