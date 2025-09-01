import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import createApiInstance from "../utils/api";
import { useNavigate } from "react-router-dom";

const TeamForm = ({ initialTeam, onClose, onTeamCreated }) => {
  const { token, subdomain } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: initialTeam?.name || "",
    user_ids: initialTeam?.user_ids || [],
  });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const api = createApiInstance(token, subdomain);

  const handleApiError = useCallback(
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return "Session expired. Please log in again.";
      }
      return (
        error.response?.data?.errors?.join(", ") ||
        error.response?.data?.error ||
        "Failed to save team."
      );
    },
    [navigate]
  );

  const validateAuth = useCallback(() => {
    if (!token || !subdomain) {
      setMessage("Please log in to continue.");
      setIsError(true);
      navigate("/login");
      return false;
    }
    return true;
  }, [token, subdomain, navigate]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage("Team name is required.");
      setIsError(true);
      return false;
    }
    if (formData.user_ids.length === 0) {
      setMessage("At least one team member is required.");
      setIsError(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!validateAuth()) return;
      try {
        const response = await api.get(`/organizations/${subdomain}/users`);
        const usersData = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];
        setUsers(usersData);
        setMessage(
          usersData.length ? "" : "No users found in this organization."
        );
      } catch (error) {
        setMessage(handleApiError(error));
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, subdomain, validateAuth, handleApiError, api]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) =>
      parseInt(opt.value, 10)
    );
    setFormData((prev) => ({ ...prev, user_ids: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!validateAuth() || !validateForm()) return;

    try {
      if (initialTeam) {
        await api.put(`/organizations/${subdomain}/teams/${initialTeam.id}`, {
          team: {
            name: formData.name,
            user_ids: formData.user_ids,
          },
        });
        setMessage("✅ Team updated successfully!");
      } else {
        await api.post(`/organizations/${subdomain}/teams`, {
          team: {
            name: formData.name,
            user_ids: formData.user_ids,
          },
        });
        setMessage("✅ Team created successfully!");
        setFormData({ name: "", user_ids: [] }); // Reset only on create
      }
      onTeamCreated?.();
      onClose?.();
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
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        {initialTeam ? "Edit Team" : "Create Team"}
      </h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Team Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Team Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength="2"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Team Members
          </label>
          <select
            multiple
            name="user_ids"
            value={formData.user_ids.map(String)}
            onChange={handleUserSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={users.length === 0}
            aria-label="Select team members"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {users.length === 0
              ? "No users available in this organization."
              : "Hold Ctrl (Windows) or Cmd (Mac) to select multiple users."}
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {initialTeam ? "Update Team" : "Create Team"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamForm;
