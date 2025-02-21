// src/components/AdminDashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricChart from './MetricChart';
import CreateUserForm from './CreateUserForm';
import CreateTeamForm from './CreateTeamForm'; // Import the CreateTeamForm component

const AdminDashboard = ({ organizationSubdomain, token }) => {
  const navigate = useNavigate();
  const [isCreateUserFormOpen, setIsCreateUserFormOpen] = useState(false);
  const [isCreateTeamFormOpen, setIsCreateTeamFormOpen] = useState(false); // New state for team form

  const handleAddUser = () => {
    setIsCreateUserFormOpen(true); // Open the user form
  };

  const handleAddTeam = () => {
    setIsCreateTeamFormOpen(true); // Open the team form
  };

  const handleCloseUserForm = () => {
    setIsCreateUserFormOpen(false); // Close the user form
  };

  const handleCloseTeamForm = () => {
    setIsCreateTeamFormOpen(false); // Close the team form
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>

      {/* Buttons Container */}
      <div className="flex space-x-4 mb-6">
        {/* Add User Button */}
        <button
          onClick={handleAddUser}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add User
        </button>

        {/* Add Team Button */}
        <button
          onClick={handleAddTeam}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add Team
        </button>
      </div>

      {/* Metric Chart */}
      <MetricChart />

      {/* Popup Form for Creating User */}
      {isCreateUserFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <CreateUserForm
              orgSubdomain={organizationSubdomain}
              token={token}
              onClose={handleCloseUserForm}
            />
          </div>
        </div>
      )}

      {/* Popup Form for Creating Team */}
      {isCreateTeamFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <CreateTeamForm
              onClose={handleCloseTeamForm}
            />
          </div>
        </div>
      )}

      {/* Other dashboard content */}
      {/* Add any additional admin dashboard content here */}
    </div>
  );
};

export default AdminDashboard;