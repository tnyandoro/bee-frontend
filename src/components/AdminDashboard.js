import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricChart from './MetricChart'; // Import the MetricChart component
import CreateUserForm from './CreateUserForm'; // Import the CreateUserForm component

const AdminDashboard = ({ organizationSubdomain, token }) => {
  const navigate = useNavigate();
  const [isCreateUserFormOpen, setIsCreateUserFormOpen] = useState(false);

  const handleAddUser = () => {
    setIsCreateUserFormOpen(true); // Open the form
  };

  const handleCloseForm = () => {
    setIsCreateUserFormOpen(false); // Close the form
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>
      
      {/* Add User Button */}
      <button 
        onClick={handleAddUser} 
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
      >
        Add User
      </button>
      
      {/* Metric Chart */}
      <MetricChart />

      {/* Popup Form for Creating User */}
      {isCreateUserFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <CreateUserForm 
              orgSubdomain={organizationSubdomain} 
              token={token} 
              onClose={handleCloseForm} 
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
