import React, { useState, useEffect, useCallback } from "react";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

const UserList = ({ organizationSubdomain }) => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const effectiveSubdomain = organizationSubdomain || subdomain;

  // Clear message after timeout
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const handleApiError = useCallback(
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return "Session expired. Please log in again.";
      } else if (error.response?.data?.errors) {
        return error.response.data.errors.join(", ");
      } else if (error.response?.data?.error) {
        return error.response.data.error;
      } else {
        return error.message;
      }
    },
    [navigate]
  );

  const fetchTeams = useCallback(async () => {
    try {
      const api = createApiInstance(token, effectiveSubdomain); // fixed
      const response = await api.get(
        `/organizations/${effectiveSubdomain}/teams`
      );
      return response.data || [];
    } catch (error) {
      setMessage(handleApiError(error));
      setIsError(true);
      return [];
    }
  }, [token, effectiveSubdomain, handleApiError]);

  const fetchUsers = useCallback(async () => {
    if (!token || !effectiveSubdomain) {
      setMessage("Missing authentication or organization context.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const [teamsData, usersResponse] = await Promise.all([
        fetchTeams(),
        createApiInstance(token, effectiveSubdomain).get(
          `/organizations/${effectiveSubdomain}/users`
        ),
      ]);

      const usersData = Array.isArray(usersResponse.data.data)
        ? usersResponse.data.data
        : [];

      // Enhance users with team names
      const usersWithTeamNames = usersData.map((user) => {
        const userTeam = teamsData.find((team) => team.id === user.team_id);
        return {
          ...user,
          team_name: userTeam ? userTeam.name : "Unassigned",
        };
      });

      if (usersWithTeamNames.length === 0) {
        setMessage("No users found for this organization.");
      }

      setUsers(usersWithTeamNames);
    } catch (error) {
      setMessage(handleApiError(error));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [token, effectiveSubdomain, fetchTeams, handleApiError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const api = createApiInstance(token);
      await api.delete(`/organizations/${effectiveSubdomain}/users/${userId}`);
      setMessage("User deleted successfully!");
      setIsError(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      setMessage(handleApiError(error));
      setIsError(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-blue-700 animate-pulse">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-blue-100">
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <thead className="bg-blue-100">
            <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-widerr">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 text-sm">
                  <td className="py-2 px-4 border">{user.name}</td>
                  <td className="py-2 px-4 border">{user.email}</td>
                  <td className="py-2 px-4 border capitalize">{user.role}</td>
                  <td className="py-2 px-4 border">
                    {user.team_name || "No team"}
                  </td>
                  <td className="py-2 px-4 border space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label={`Edit user ${user.name}`}
                      onClick={() => navigate(`/users/${user.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Delete user ${user.name}`}
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
                  No users available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
