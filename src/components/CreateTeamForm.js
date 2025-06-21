import React, { useState, useEffect, useCallback } from "react";
import createApiInstance from "../utils/api"; // Using your existing api.js
import { useNavigate } from "react-router-dom";

const CreateTeamForm = ({ onClose, onTeamCreated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    user_ids: [],
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const getAuthCredentials = useCallback(() => {
    const token = localStorage.getItem("authToken");
    const subdomain = localStorage.getItem("orgSubdomain");

    if (!token || !subdomain) {
      setMessage("Please log in to continue.");
      setIsError(true);
      navigate("/login");
      return null;
    }
    return { token, subdomain };
  }, [navigate]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage("Please provide a team name.");
      setIsError(true);
      return false;
    }
    if (formData.user_ids.length === 0) {
      setMessage("Please select at least one user.");
      setIsError(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      const credentials = getAuthCredentials();
      if (!credentials) return;

      try {
        const { token, subdomain } = credentials;
        const api = createApiInstance(token, subdomain);
        const response = await api.get("/users");
        const usersData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        if (isMounted) {
          if (usersData.length === 0) {
            setMessage("No users found for this organization.");
            setUsers([]);
          } else {
            setUsers(usersData);
            setMessage("");
          }
        }
      } catch (error) {
        if (isMounted) {
          setMessage(handleApiError(error));
          setIsError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [getAuthCredentials, handleApiError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
      parseInt(option.value, 10)
    );
    setFormData((prev) => ({ ...prev, user_ids: selectedOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const credentials = getAuthCredentials();
    if (!credentials || !validateForm()) return;

    try {
      const { token, subdomain } = credentials;
      const api = createApiInstance(token, subdomain);
      await api.post("/teams", {
        team: {
          name: formData.name,
          user_ids: formData.user_ids,
        },
      });

      setMessage("Team created successfully!");
      setFormData({ name: "", user_ids: [] });
      setIsError(false);
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Team</h2>

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
            Assign Users
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
            Create Team
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamForm;
