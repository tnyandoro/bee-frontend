// src/components/Dashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import createApiInstance from "../utils/api";
import MyChartComponent from "./MyChartComponent";
import { useNavigate } from "react-router-dom";

// Mock data for testing fallback
const mockData = {
  organization: { name: "Mock Organization" },
  stats: {
    open_tickets: 5,
    assigned_tickets: 10,
    escalated_tickets: 1,
    high_priority_tickets: 2,
    resolved_tickets: 8,
    closed_tickets: 12,
  },
  charts: {
    tickets_by_status: {
      open: 5,
      assigned: 10,
      escalated: 1,
      resolved: 8,
      closed: 12,
    },
    tickets_by_priority: {
      p1: 2,
      p2: 5,
      p3: 8,
      p4: 11,
    },
    top_assignees: [
      { name: "User A", tickets: 10 },
      { name: "User B", tickets: 7 },
    ],
  },
  sla: {
    breached: 1,
    breaching_soon: 3,
    on_time_rate_percent: 95,
    avg_resolution_hours: 12,
  },
  recent_tickets: [
    {
      id: 1,
      title: "Sample ticket 1",
      status: "open",
      priority: "p1",
      assignee: "User A",
      reporter: "User X",
      created_at: new Date().toISOString(),
      sla_breached: false,
      breaching_sla: true,
    },
    {
      id: 2,
      title: "Sample ticket 2",
      status: "resolved",
      priority: "p3",
      assignee: "User B",
      reporter: "User Y",
      created_at: new Date().toISOString(),
      sla_breached: false,
      breaching_sla: false,
    },
  ],
  meta: { fetched_at: new Date().toISOString() },
};

const maxRetries = 3;

// Tailwind color mappings for StatCard
const statColors = {
  blue: "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
  emerald: "bg-emerald-100 text-emerald-800",
  teal: "bg-teal-100 text-teal-800",
};

const metricColors = {
  red: "border-red-200 bg-red-50 text-red-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
  green: "border-green-200 bg-green-50 text-green-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
};

const Dashboard = () => {
  const { currentUser, subdomain, error: authError } = useAuth();

  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchDashboard = useCallback(async () => {
    if (!subdomain) {
      setError(
        "Organization subdomain is missing. Please ensure you're logged into the correct organization."
      );
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token is missing. Please log in again.");
      setLoading(false);
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const api = createApiInstance(token, subdomain);
      const response = await api.get(`/organizations/${subdomain}/dashboard`);

      console.log("Full API response:", response);

      const data = response.data.data || response.data;

      // Fallback to mock data if no valid data
      if (
        !data ||
        Object.keys(data).length === 0 ||
        (!data.stats && !data.recent_tickets && !data.organization)
      ) {
        console.warn("Dashboard data empty or incomplete, loading mock data");
        setDashboardData(mockData);
      } else {
        // Normalize organization object
        if (data.organization) {
          if (typeof data.organization === "string") {
            data.organization = { name: data.organization };
          } else if (!data.organization.name) {
            data.organization.name = "Organization";
          }
        }
        setDashboardData(data);
      }

      setError("");
      setRetryCount(0);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError("Failed to load dashboard. Using mock data.");
      setDashboardData(mockData);
      setLoading(false);

      // Disabled retry logic for testing
      /*
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setError(`Retrying... (${retryCount + 1}/${maxRetries}) ${message}`);
        setTimeout(fetchDashboard, 2000 * (retryCount + 1));
      } else {
        setError(`${message} All retries failed.`);
        setLoading(false);
      }
      */
    }
  }, [subdomain, navigate /*retryCount*/]);

  useEffect(() => {
    fetchDashboard();

    const timer = setTimeout(() => {
      if (!dashboardData) {
        console.warn("Timeout reached, loading mock data");
        setDashboardData(mockData);
        setLoading(false);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>
            Loading dashboard data...{" "}
            {retryCount > 0 ? `(Retry ${retryCount}/${maxRetries})` : ""}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-bold text-lg mb-2">Dashboard Error</h3>
          <p>{error}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                setRetryCount(0);
                setLoading(true);
                fetchDashboard();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-4 text-center text-gray-500">
        No dashboard data available.
      </div>
    );
  }

  const org = dashboardData.organization || {};
  const stats = dashboardData.stats || {};
  const charts = dashboardData.charts || {};
  const sla = dashboardData.sla || {};
  const recent_tickets = dashboardData.recent_tickets || [];
  const meta = dashboardData.meta || { fetched_at: new Date().toISOString() };

  const orgName = typeof org === "string" ? org : org.name || "Organization";
  const updatedTime = meta.fetched_at
    ? new Date(meta.fetched_at).toLocaleString()
    : "Just now";

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header with current user */}
      <div className="bg-indigo-600 text-white shadow-lg rounded-lg mb-6 p-6">
        <h1 className="text-2xl font-bold">
          {orgName.toUpperCase()} DASHBOARD
        </h1>
        {currentUser?.name && (
          <p className="text-indigo-100">
            Welcome, <span className="font-semibold">{currentUser.name}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Open" value={stats.open_tickets || 0} color="blue" />
        <StatCard
          label="Assigned"
          value={stats.assigned_tickets || 0}
          color="indigo"
        />
        <StatCard
          label="Escalated"
          value={stats.escalated_tickets || 0}
          color="purple"
        />
        <StatCard
          label="Critical"
          value={stats.high_priority_tickets || 0}
          color="red"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved_tickets || 0}
          color="emerald"
        />
        <StatCard
          label="Closed"
          value={stats.closed_tickets || 0}
          color="teal"
        />
      </div>

      {/* Charts */}
      <div className="mb-6">
        {charts.tickets_by_status ||
        charts.tickets_by_priority ||
        charts.top_assignees ? (
          <MyChartComponent dashboardData={dashboardData} />
        ) : (
          <div className="bg-white p-5 rounded-lg shadow border text-center text-gray-500">
            No chart data available
          </div>
        )}
      </div>

      {/* SLA Metrics */}
      <div className="bg-white p-5 rounded-lg shadow mb-6 border">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          SLA Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Missed SLA"
            value={sla.breached || 0}
            color="red"
          />
          <MetricCard
            label="Breaching Soon"
            value={sla.breaching_soon || 0}
            color="yellow"
          />
          <MetricCard
            label="On-Time Rate"
            value={`${sla.on_time_rate_percent || 100}%`}
            color="green"
          />
          <MetricCard
            label="Avg Resolution"
            value={`${sla.avg_resolution_hours || 0}h`}
            color="blue"
          />
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white p-5 rounded-lg shadow border overflow-hidden">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Recent Tickets
        </h3>
        {recent_tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Priority</th>
                  <th className="px-4 py-2 text-left">Assignee</th>
                  <th className="px-4 py-2 text-left">Reporter</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">SLA</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recent_tickets.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-indigo-600 truncate max-w-xs">
                      {t.title || "Untitled"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          {
                            open: "bg-yellow-100 text-yellow-800",
                            assigned: "bg-blue-100 text-blue-800",
                            escalated: "bg-purple-100 text-purple-800",
                            resolved: "bg-green-100 text-green-800",
                            closed: "bg-gray-100 text-gray-800",
                            suspended: "bg-orange-100 text-orange-800",
                            pending: "bg-gray-200 text-gray-800",
                          }[t.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          {
                            p1: "bg-red-100 text-red-800",
                            p2: "bg-orange-100 text-orange-800",
                            p3: "bg-yellow-100 text-yellow-800",
                            p4: "bg-green-100 text-green-800",
                          }[t.priority] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t.priority || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-2">{t.assignee || "Unassigned"}</td>
                    <td className="px-4 py-2">{t.reporter || "Unknown"}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      {t.sla_breached ? (
                        <span className="text-red-600 text-xs">
                          ❌ Breached
                        </span>
                      ) : t.breaching_sla ? (
                        <span className="text-yellow-600 text-xs">
                          ⚠️ Breaching
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs">✅ OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No recent tickets found
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="text-xs text-gray-500 text-right mt-4">
        Updated: {updatedTime}
      </div>
    </div>
  );
};

// --- StatCard Component ---
const StatCard = ({ label, value, color }) => {
  const colorClass = statColors[color] || "bg-gray-100 text-gray-800";
  return (
    <div className={`p-4 rounded-lg shadow-sm text-center ${colorClass}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

// --- MetricCard Component ---
const MetricCard = ({ label, value, color }) => {
  const colorClass =
    metricColors[color] || "border-gray-200 bg-gray-50 text-gray-700";
  return (
    <div className={`p-3 text-center rounded border ${colorClass}`}>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      <div className={`text-xl font-bold`}>{value}</div>
    </div>
  );
};

export default Dashboard;
