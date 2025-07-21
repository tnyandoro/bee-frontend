import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import CreateTeamForm from "./CreateTeamForm";

const AdminDashboard = () => {
  const [isCreateUserFormOpen, setIsCreateUserFormOpen] = useState(false);
  const [isCreateTeamFormOpen, setIsCreateTeamFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-6 ml-64">
      {" "}
      {/* Adjust for sidebar */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <Card className="w-64">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-gray-700">Users</h2>
            <p className="text-sm text-gray-500">
              Manage all users in your org
            </p>
            <Button
              onClick={() => setIsCreateUserFormOpen(true)}
              className="mt-4 w-full"
            >
              Create User
            </Button>
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-gray-700">Teams</h2>
            <p className="text-sm text-gray-500">
              Create and manage support teams
            </p>
            <Button
              onClick={() => setIsCreateTeamFormOpen(true)}
              className="mt-4 w-full"
            >
              Create Team
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Create User Modal */}
      {isCreateUserFormOpen && (
        <div className="absolute top-24 left-[calc(50%+128px)] transform -translate-x-1/2 bg-white p-4 rounded shadow-xl z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Create User</h3>
            <button onClick={() => setIsCreateUserFormOpen(false)}>
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <CreateUserForm onClose={() => setIsCreateUserFormOpen(false)} />
        </div>
      )}
      {/* Create Team Modal */}
      {isCreateTeamFormOpen && (
        <div className="absolute top-24 left-[calc(50%+128px)] transform -translate-x-1/2 bg-white p-4 rounded shadow-xl z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Create Team</h3>
            <button onClick={() => setIsCreateTeamFormOpen(false)}>
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <CreateTeamForm onClose={() => setIsCreateTeamFormOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
