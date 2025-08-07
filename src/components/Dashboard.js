import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyChartComponent from "./MyChartComponent";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";
};

const Dashboard = () => {
  const { organization, currentUser } = useAuth();
  const subdomain =
    organization?.subdomain || localStorage.getItem("subdomain");
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    if (!subdomain) {
      setError("Organization subdomain missing.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    try {
      const url = `${getApiBaseUrl()}/organizations/${subdomain}/dashboard`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      setDashboardData(response.data.data || response.data); // Handle both response formats
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      const message =
        err.response?.status === 404
          ? "Organization not found."
          : err.response?.status === 403
          ? "Access denied."
          : "Failed to load dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!dashboardData) return <div className="p-4">No data available.</div>;

  const {
    organization: org,
    stats,
    charts,
    sla,
    recent_tickets,
  } = dashboardData;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 text-white shadow-lg rounded-lg mb-6 p-6">
        <h1 className="text-2xl font-bold">
          {org.name.toUpperCase()} DASHBOARD
        </h1>
        {currentUser?.name && (
          <p className="text-indigo-100">
            Welcome, <span className="font-semibold">{currentUser.name}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Open" value={stats.open_tickets} color="blue" />
        <StatCard
          label="Assigned"
          value={stats.assigned_tickets}
          color="indigo"
        />
        <StatCard
          label="Escalated"
          value={stats.escalated_tickets}
          color="purple"
        />
        <StatCard
          label="Critical"
          value={stats.high_priority_tickets}
          color="red"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved_tickets}
          color="emerald"
        />
        <StatCard label="Closed" value={stats.closed_tickets} color="teal" />
      </div>

      {/* Charts */}
      <MyChartComponent dashboardData={dashboardData} />

      {/* SLA Metrics */}
      <div className="bg-white p-5 rounded-lg shadow mb-6 border">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          SLA Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Missed SLA" value={sla.breached} color="red" />
          <MetricCard
            label="Breaching Soon"
            value={sla.breaching_soon}
            color="yellow"
          />
          <MetricCard
            label="On-Time Rate"
            value={`${sla.on_time_rate_percent}%`}
            color="green"
          />
          <MetricCard
            label="Avg Resolution"
            value={`${sla.avg_resolution_hours}h`}
            color="blue"
          />
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white p-5 rounded-lg shadow border overflow-hidden">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Recent Tickets
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Assignee</th>
                <th className="px-4 py-2 text-left">Reported</th>
                <th className="px-4 py-2 text-left">SLA</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recent_tickets.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-indigo-600 truncate max-w-xs">
                    {t.title}
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
                        }[t.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        {
                          Critical: "bg-red-100 text-red-800",
                          High: "bg-orange-100 text-orange-800",
                          Medium: "bg-yellow-100 text-yellow-800",
                          Low: "bg-green-100 text-green-800",
                        }[t.priority] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2">{t.assignee || "Unassigned"}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {t.sla_breached ? (
                      <span className="text-red-600 text-xs">❌ Breached</span>
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
      </div>

      {/* Meta Info */}
      <div className="text-xs text-gray-500 text-right mt-4">
        Updated: {new Date(dashboardData.meta.fetched_at).toLocaleString()}
      </div>
    </div>
  );
};

// --- StatCard Component ---
const StatCard = ({ label, value, color }) => (
  <div
    className={`p-4 bg-${color}-100 text-${color}-800 rounded-lg shadow-sm text-center`}
  >
    <div className="text-sm font-medium">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

// --- Reusable MetricCard ---
const MetricCard = ({ label, value, color }) => (
  <div
    className={`p-3 text-center rounded border border-${color}-200 bg-${color}-50`}
  >
    <div className="text-sm text-gray-600 font-medium">{label}</div>
    <div className={`text-xl font-bold text-${color}-700`}>{value}</div>
  </div>
);

export default Dashboard;
