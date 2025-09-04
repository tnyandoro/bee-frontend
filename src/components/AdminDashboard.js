import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, X } from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart,
  ArcElement,
  PieController,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CreateUserForm from "./CreateUserForm";
import TeamForm from "./TeamForm";
import TeamList from "./TeamList";
import UserList from "./UserList";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";

// Register Chart.js components
Chart.register(
  ArcElement,
  PieController,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, color, textColor }) => (
  <div className={`p-4 rounded shadow ${color} ${textColor}`}>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const AdminDashboard = ({ organizationSubdomain }) => {
  const {
    token,
    subdomain: authSubdomain,
    refreshToken,
    logout,
    currentUser,
  } = useAuth();
  const navigate = useNavigate();

  const [isCreateUserFormOpen, setIsCreateUserFormOpen] = useState(false);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isTeamListOpen, setIsTeamListOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const api = useRef(null);
  const isFetchingStats = useRef(false);
  const isFetchingUsers = useRef(false);

  const getEffectiveSubdomain = useCallback(() => {
    const subdomain =
      organizationSubdomain && organizationSubdomain !== "undefined"
        ? organizationSubdomain
        : authSubdomain && authSubdomain !== "undefined"
        ? authSubdomain
        : process.env.NODE_ENV === "development"
        ? "demo"
        : null;

    console.log("Effective subdomain calculation:", {
      organizationSubdomain,
      authSubdomain,
      result: subdomain,
      nodeEnv: process.env.NODE_ENV,
    });

    return subdomain;
  }, [organizationSubdomain, authSubdomain]);

  useEffect(() => {
    const activeSubdomain = getEffectiveSubdomain();

    console.log("API instance setup:", {
      activeSubdomain,
      token: !!token,
      hasApiInstance: !!api.current,
    });

    if (activeSubdomain && token) {
      api.current = createApiInstance(token, activeSubdomain);
      console.log("API instance created successfully");
    } else {
      console.log("Cannot create API instance - missing requirements");
    }
  }, [token, getEffectiveSubdomain]);

  const handleApiError = useCallback(
    (error) => {
      console.error("API error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        setError("Session expired. Attempting to refresh token...");
        refreshToken()
          .then((newToken) => {
            if (newToken) {
              api.current = createApiInstance(
                newToken,
                getEffectiveSubdomain()
              );
              setError("");
            } else {
              logout();
              navigate("/login");
            }
          })
          .catch((err) => {
            console.error("Token refresh failed:", err);
            logout();
            navigate("/login");
          });
        return "Session expired.";
      }
      return (
        error.response?.data?.error || `An error occurred: ${error.message}`
      );
    },
    [navigate, refreshToken, logout, getEffectiveSubdomain]
  );

  const fetchDashboardStats = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();

    console.log("fetchDashboardStats called:", {
      activeSubdomain,
      token: !!token,
      hasApiInstance: !!api.current,
      isFetching: isFetchingStats.current,
    });

    if (!activeSubdomain || !token) {
      const errorMsg = `Missing requirements: subdomain=${activeSubdomain}, token=${!!token}`;
      console.error(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    if (!api.current) {
      console.log("No API instance, creating one...");
      api.current = createApiInstance(token, activeSubdomain);
    }

    if (isFetchingStats.current) {
      console.log("Already fetching stats, skipping...");
      return;
    }

    isFetchingStats.current = true;
    setLoading(true);
    setError("");

    try {
      console.log(
        `Making request to: /organizations/${activeSubdomain}/dashboard`
      );
      const response = await api.current.get(
        `/organizations/${activeSubdomain}/dashboard`
      );
      const statsData = response.data?.data;
      console.log("API response:", JSON.stringify(statsData, null, 2)); // Debug logging
      if (!statsData?.stats) {
        setError("No stats data returned from the server.");
        setDashboardStats(null);
        return;
      }

      const requiredStats = [
        "total_tickets",
        "open_tickets",
        "assigned_tickets",
        "escalated_tickets",
        "resolved_tickets",
        "closed_tickets",
        "total_problems",
        "p1_tickets", // Updated from high_priority_tickets
        "unresolved_tickets",
        "resolution_rate_percent",
      ];
      const missingStats = requiredStats.filter(
        (key) =>
          statsData.stats[key] === undefined || statsData.stats[key] === null
      );
      if (missingStats.length > 0) {
        console.warn("Missing or null stats:", missingStats);
        setError(`Incomplete stats data: missing ${missingStats.join(", ")}.`);
        setDashboardStats(null);
        return;
      }
      const statsEmpty = Object.values(statsData.stats).every(
        (value) => value === 0
      );
      if (statsEmpty && statsData.recent_tickets?.length > 0) {
        setError(
          "Ticket statistics are empty despite recent tickets. Possible data issue."
        );
      }
      setDashboardStats(statsData);
      console.log("Dashboard stats loaded successfully:", statsData.stats);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(handleApiError(err));
      setDashboardStats(null);
    } finally {
      setLoading(false);
      isFetchingStats.current = false;
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  const fetchUsers = useCallback(async () => {
    const activeSubdomain = getEffectiveSubdomain();

    console.log("fetchUsers called:", {
      activeSubdomain,
      token: !!token,
      hasApiInstance: !!api.current,
      isFetching: isFetchingUsers.current,
    });

    if (!activeSubdomain || !token) {
      const errorMsg = `Missing requirements for users: subdomain=${activeSubdomain}, token=${!!token}`;
      console.error(errorMsg);
      return;
    }

    if (!api.current) {
      console.log("No API instance for users, creating one...");
      api.current = createApiInstance(token, activeSubdomain);
    }

    if (isFetchingUsers.current) {
      console.log("Already fetching users, skipping...");
      return;
    }

    isFetchingUsers.current = true;
    try {
      console.log(`Making request to: /organizations/${activeSubdomain}/users`);
      const response = await api.current.get(
        `/organizations/${activeSubdomain}/users`
      );
      setUsers(response.data.data || response.data);
      console.log("Users loaded successfully");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(handleApiError(err));
    } finally {
      isFetchingUsers.current = false;
    }
  }, [token, getEffectiveSubdomain, handleApiError]);

  useEffect(() => {
    const activeSubdomain = getEffectiveSubdomain();

    console.log("Data fetch effect triggered:", {
      token: !!token,
      activeSubdomain,
      hasApiInstance: !!api.current,
    });

    if (token && activeSubdomain) {
      const timer = setTimeout(() => {
        fetchDashboardStats();
        fetchUsers();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [token, getEffectiveSubdomain, fetchDashboardStats, fetchUsers]);

  const retryDashboard = () => {
    console.log("Retrying dashboard fetch...");
    setError("");
    setDashboardStats(null);
    fetchDashboardStats();
  };

  const handleOpenTeamForm = (team = null) => {
    setSelectedTeam(team);
    setIsTeamFormOpen(true);
  };

  const handleCloseTeamForm = () => {
    setIsTeamFormOpen(false);
    setSelectedTeam(null);
    fetchUsers();
  };

  const stats = dashboardStats?.stats || {
    total_tickets: 0,
    open_tickets: 0,
    assigned_tickets: 0,
    escalated_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    total_problems: 0,
    total_members: 0,
    p1_tickets: 0,
    unresolved_tickets: 0,
    resolution_rate_percent: 0,
  };

  const slaData = dashboardStats?.sla || {
    breached: 0,
    breaching_soon: 0,
    on_time_rate_percent: 100,
    avg_resolution_hours: 0,
  };

  const ticketChartData = {
    labels: [
      "Total",
      "Open",
      "Assigned",
      "Resolved",
      "Closed",
      "P1 Tickets",
      "Problems",
    ],
    datasets: [
      {
        label: "Count",
        data: [
          stats.total_tickets,
          stats.open_tickets,
          stats.assigned_tickets,
          stats.resolved_tickets,
          stats.closed_tickets,
          stats.p1_tickets,
          stats.total_problems,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // Total
          "rgba(255, 206, 86, 0.6)", // Open
          "rgba(54, 162, 235, 0.6)", // Assigned
          "rgba(75, 192, 75, 0.6)", // Resolved
          "rgba(0, 128, 0, 0.6)", // Closed
          "rgba(255, 99, 132, 0.6)", // P1
          "rgba(153, 102, 255, 0.6)", // Problems
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 75, 1)",
          "rgba(0, 128, 0, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const slaPieData = {
    labels: ["On Time", "Breached", "Breaching Soon"],
    datasets: [
      {
        label: "SLA Performance",
        data: [
          stats.total_tickets - slaData.breached - slaData.breaching_soon,
          slaData.breached,
          slaData.breaching_soon,
        ],
        backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
        borderColor: ["#388e3c", "#d32f2f", "#f57c00"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.raw} ${
              context.raw !== 1 ? "tickets" : "ticket"
            }`,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  return (
    <div className="mt-2 p-4 ml-4">
      <div className="bg-gray-200 shadow-xl rounded-lg mb-4 p-4">
        <h1 className="text-3xl font-semibold">
          Welcome to the{" "}
          {dashboardStats?.organization?.name?.toUpperCase() || "Organization"}{" "}
          Admin Dashboard
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={retryDashboard}
            className="flex items-center bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setIsCreateUserFormOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add User
        </button>
        <button
          onClick={() => handleOpenTeamForm()}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add Team
        </button>
        <button
          onClick={() => setIsTeamListOpen(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Show Teams
        </button>
        <button
          onClick={() => setIsUserListOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Show Users
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      ) : dashboardStats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Tickets"
              value={stats.total_tickets}
              color="bg-blue-100"
              textColor="text-blue-800"
            />
            <StatCard
              title="Open Tickets"
              value={stats.open_tickets}
              color="bg-yellow-100"
              textColor="text-yellow-800"
            />
            <StatCard
              title="Assigned Tickets"
              value={stats.assigned_tickets}
              color="bg-indigo-100"
              textColor="text-indigo-800"
            />
            <StatCard
              title="Resolved Tickets"
              value={stats.resolved_tickets}
              color="bg-green-200"
              textColor="text-green-900"
            />
            <StatCard
              title="Closed Tickets"
              value={stats.closed_tickets}
              color="bg-green-100"
              textColor="text-green-800"
            />
            <StatCard
              title="P1 Tickets"
              value={stats.p1_tickets}
              color="bg-red-200"
              textColor="text-red-900"
            />
            <StatCard
              title="Problems"
              value={stats.total_problems}
              color="bg-red-100"
              textColor="text-red-800"
            />
            <StatCard
              title="Team Members"
              value={stats.total_members}
              color="bg-teal-100"
              textColor="text-teal-800"
            />
            <StatCard
              title="Unresolved Tickets"
              value={stats.unresolved_tickets}
              color="bg-orange-100"
              textColor="text-orange-800"
            />
            <StatCard
              title="Resolution Rate"
              value={`${stats.resolution_rate_percent}%`}
              color="bg-blue-200"
              textColor="text-blue-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Ticket Overview</h3>
              <Bar data={ticketChartData} options={chartOptions} />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-2">SLA Performance</h3>
              <div className="h-64">
                <Pie data={slaPieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {isCreateUserFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
                <button
                  onClick={() => setIsCreateUserFormOpen(false)}
                  className="absolute top-3 right-3"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-xl font-semibold mb-4">Create User</h3>
                <CreateUserForm
                  onClose={() => setIsCreateUserFormOpen(false)}
                />
              </div>
            </div>
          )}

          {isTeamFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
                <button
                  onClick={handleCloseTeamForm}
                  className="absolute top-3 right-3"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-xl font-semibold mb-4">
                  {selectedTeam ? "Edit Team" : "Create Team"}
                </h3>
                <TeamForm
                  initialTeam={selectedTeam}
                  onClose={handleCloseTeamForm}
                  onTeamCreated={handleCloseTeamForm}
                />
              </div>
            </div>
          )}

          {isTeamListOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-xl relative">
                <button
                  onClick={() => setIsTeamListOpen(false)}
                  className="absolute top-3 right-3"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-xl font-semibold mb-4">Teams</h3>
                <TeamList
                  organizationSubdomain={getEffectiveSubdomain()}
                  onEdit={(team) => {
                    setIsTeamListOpen(false);
                    handleOpenTeamForm(team);
                  }}
                />
              </div>
            </div>
          )}

          {isUserListOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-xl relative">
                <button
                  onClick={() => setIsUserListOpen(false)}
                  className="absolute top-3 right-3"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-xl font-semibold mb-4">Users</h3>
                <UserList users={users} />
              </div>
            </div>
          )}
        </>
      ) : !error ? (
        <p className="text-gray-500 mb-6">Loading dashboard metrics...</p>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
