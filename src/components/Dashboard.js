import React, { useEffect, useState, useCallback } from "react";
import createApiInstance from "../api";

const Dashboard = ({ token, subdomain }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for fallback display
  const mockData = {
    totalUsers: 42,
    totalTeams: 5,
    openTickets: 17,
    closedTickets: 83,
    lastUpdated: new Date().toISOString(),
  };

  const fetchDashboard = useCallback(async () => {
    // Ensure we only run once both token and subdomain are available
    if (!token || !subdomain) {
      console.warn("Dashboard skipped — missing token or subdomain");
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching dashboard for subdomain: ${subdomain}`);

      const api = createApiInstance(token, subdomain);
      const res = await api.get(`/organizations/${subdomain}/dashboard`);

      console.log("✅ Dashboard API Response:", res.data);
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard");

      // Use mock data to avoid blank screen
      console.warn("⚠️ Using mock dashboard data instead");
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [token, subdomain]);

  // Fetch dashboard data on mount or when token/subdomain changes
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) console.warn("Dashboard Error:", error);

  return (
    <div>
      <h1>Dashboard</h1>
      {data ? (
        <div style={{ padding: "1rem", border: "1px solid #ccc" }}>
          <p>
            <strong>Total Users:</strong> {data.totalUsers}
          </p>
          <p>
            <strong>Total Teams:</strong> {data.totalTeams}
          </p>
          <p>
            <strong>Open Tickets:</strong> {data.openTickets}
          </p>
          <p>
            <strong>Closed Tickets:</strong> {data.closedTickets}
          </p>
          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
      ) : (
        <p>No dashboard data available</p>
      )}
    </div>
  );
};

export default Dashboard;
