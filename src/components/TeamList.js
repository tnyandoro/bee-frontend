// src/components/TeamList.js
import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

const TeamList = ({ organizationSubdomain, onEdit }) => {
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
        return "Organization or team not found";
      }
      return (
        error.response?.data?.error || error.message || "An error occurred"
      );
    },
    [navigate, refreshToken, logout, fetchTeams]
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
      setMessage(handleApiError(error));
      setIsError(true);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [token, getEffectiveSubdomain, navigate, handleApiError]);

  useEffect(() => {
    if (getEffectiveSubdomain() && token) {
      fetchTeams();
    }
  }, [fetchTeams, getEffectiveSubdomain, token]);

  const handleDeactivate = async (teamId) => {
    if (!window.confirm("Are you sure you want to deactivate this team?"))
      return;
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
      await api.patch(
        `/organizations/${activeSubdomain}/teams/${teamId}/deactivate`
      );
      setMessage("Team deactivated successfully");
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
                  <td className="p-3 border">{team.user_count || 0}</td>
                  <td className="p-3 border">
                    {new Date(team.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">
                    <button
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      onClick={() => onEdit(team)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeactivate(team.id)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  {!isError && "No active teams available"}
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
  onEdit: PropTypes.func,
};

export default TeamList;
