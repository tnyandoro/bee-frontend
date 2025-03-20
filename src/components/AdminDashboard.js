// src/components/AdminDashboard.js
import React, { useState } from 'react';
import MetricChart from './MetricChart';
import CreateUserForm from './CreateUserForm';
import CreateTeamForm from './CreateTeamForm';

const AdminDashboard = ({ organizationSubdomain, token }) => {
  const [isCreateUserFormOpen, setIsCreateUserFormOpen] = useState(false);
  const [isCreateTeamFormOpen, setIsCreateTeamFormOpen] = useState(false);

  const handleAddUser = () => {
    setIsCreateUserFormOpen(true);
  };

  const handleAddTeam = () => {
    setIsCreateTeamFormOpen(true);
  };

  const handleCloseUserForm = () => {
    setIsCreateUserFormOpen(false);
  };

  const handleCloseTeamForm = () => {
    setIsCreateTeamFormOpen(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>

      {/* Buttons Container */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={handleAddUser}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add User
        </button>
        <button
          onClick={handleAddTeam}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add Team
        </button>
      </div>

      <MetricChart />

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

      {isCreateTeamFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <CreateTeamForm onClose={handleCloseTeamForm} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;