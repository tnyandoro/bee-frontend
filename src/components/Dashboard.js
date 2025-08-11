import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import createApiInstance from "../utils/api";
import MyChartComponent from "./MyChartComponent";

// Mock dashboard data
const mockDashboardData = {
  stats: {
    total_tickets: 120,
    open_tickets: 30,
    resolved_tickets: 80,
    closed_tickets: 10,
  },
  charts: {
    tickets_by_priority: {
      Critical: 5,
      High: 15,
      Medium: 25,
      Low: 55,
    },
    tickets_by_status: {
      open: 30,
      assigned: 20,
      escalated: 10,
      resolved: 40,
      closed: 20,
    },
    top_assignees: [
      { name: "Alice", count: 25 },
      { name: "Bob", count: 20 },
      { name: "Charlie", count: 15 },
    ],
  },
};

const Dashboard = ({ token, subdomain }) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("dashboardData");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!token || !subdomain) {
      console.warn("No token or subdomain — using mock data");
      setData(mockDashboardData);
      localStorage.setItem("dashboardData", JSON.stringify(mockDashboardData));
      return;
    }

    try {
      setLoading(true);
      const api = createApiInstance(token, subdomain);
      const res = await api.get(`/organizations/${subdomain}/dashboard`);
      setData(res.data);
      localStorage.setItem("dashboardData", JSON.stringify(res.data));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard — using mock data");
      setData(mockDashboardData);
      localStorage.setItem("dashboardData", JSON.stringify(mockDashboardData));
    } finally {
      setLoading(false);
    }
  }, [token, subdomain]);

  useEffect(() => {
    if (!data) {
      fetchDashboard();
    }
  }, [fetchDashboard, data]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) console.warn(error);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(data.stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white p-4 rounded-lg shadow text-center"
            >
              <div className="text-gray-500 text-sm">{key}</div>
              <div className="text-2xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <MyChartComponent dashboardData={data} />

      {/* Debug */}
      <pre className="mt-8 p-4 bg-gray-100 rounded-lg overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default Dashboard;
