import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

// Mock teams data for fallback
const mockTeams = [
  {
    id: "mock-1",
    name: "Engineering",
    user_ids: ["u1", "u2", "u3"],
    created_at: "2024-06-01T10:00:00Z",
  },
  {
    id: "mock-2",
    name: "Support",
    user_ids: ["u4", "u5"],
    created_at: "2024-07-15T14:30:00Z",
  },
];

const TeamList = ({ organizationSubdomain }) => {
  const { token, subdomain: authSubdomain, refreshToken, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const getEffectiveSubdomain = useCallback(() => {
    const subdomain =
      organizationSubdomain &&
      organizationSubdomain !== "undefined" &&
      organizationSubdomain !== null
        ? organizationSubdomain
        : authSubdomain &&
          authSubdomain !== "undefined" &&
          authSubdomain !== null
        ? authSubdomain
        : process.env.NODE_ENV === "development"
        ? "demo"
        : null;
    return subdomain;
  }, [organizationSubdomain, authSubdomain]);

  const handleApiError = useCallback(
    (error) => {
      if (error.response?.status === 401) {
        setMessage("Session expired. Attempting to refresh token...");
        refreshToken()
          .then((newToken) => {
            if (newToken) {
              setMessage("");
              fetchTeams();
            } else {
              logout();
              navigate("/login");
            }
          })
          .catch(() => {
            logout();
            navigate("/login");
          });
        return "Session expired. Please log in again.";
      }
      if (error.response?.status === 404) {
        return "Organization not found";
      }
      return (
        error.response?.data?.error || error.message || "An error occurred"
      );
    },
    [navigate, refreshToken, logout]
  );

  const fetchTeams = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain) {
      setMessage("No organization subdomain available");
      setIsError(true);
      setLoading(false);
      return;
    }
    if (!token) {
      setMessage("Authentication token missing. Please log in again.");
      setIsError(true);
      setLoading(false);
      navigate("/login");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const api = createApiInstance(token, activeSubdomain);
      const response = await api.get(`/organizations/${activeSubdomain}/teams`);
      setTeams(response.data || []);
      console.log("Fetched teams from API:", response.data);
    } catch (error) {
      console.warn("API failed, using mock teams:", error);
      setMessage("Using mock data due to API error.");
      setTeams(mockTeams);
      setIsError(false); // it's not fatal if mock loads
    } finally {
      setLoading(false);
    }
  }, [token, getEffectiveSubdomain, navigate]);

  useEffect(() => {
    if (getEffectiveSubdomain() && token) {
      fetchTeams();
    }
  }, [fetchTeams, getEffectiveSubdomain, token]);

  const handleDelete = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    const activeSubdomain = getEffectiveSubdomain();
    if (!activeSubdomain) {
      setMessage("No organization subdomain available");
      setIsError(true);
      return;
    }
    if (!token) {
      setMessage("Authentication token missing. Please log in again.");
      setIsError(true);
      navigate("/login");
      return;
    }

    try {
      const api = createApiInstance(token, activeSubdomain);
      await api.delete(`/organizations/${activeSubdomain}/teams/${teamId}`);
      setMessage("Team deleted successfully");
      setIsError(false);
      fetchTeams();
    } catch (error) {
      setMessage(handleApiError(error));
      setIsError(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-blue-700 animate-pulse">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-blue-100">
            <tr>
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
          <tbody>
            {teams.length > 0 ? (
              teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{team.name}</td>
                  <td className="p-3 border">{team.user_ids?.length || 0}</td>
                  <td className="p-3 border">
                    {new Date(team.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">
                    <button
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      onClick={() => console.log("Edit team", team.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(team.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  {!isError && "No teams available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

TeamList.propTypes = {
  organizationSubdomain: PropTypes.string,
};

export default TeamList;
