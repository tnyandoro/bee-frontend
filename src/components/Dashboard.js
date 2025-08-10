// src/components/Dashboard.js
import React, { useState, useEffect, useCallback } from "react";
import createApiInstance from "../utils/api";

const Dashboard = ({ token, subdomain }) => {
  const [data, setData] = useState(() => {
    // Load from localStorage on first render
    const saved = localStorage.getItem("dashboardData");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!data); // Skip loading if we already have data
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!token || !subdomain) return;

    try {
      setLoading(true);
      const api = createApiInstance(token, subdomain);
      const res = await api.get(`/organizations/${subdomain}/dashboard`);
      setData(res.data);
      localStorage.setItem("dashboardData", JSON.stringify(res.data)); // Save for later
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard");
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
  if (error) return <div>Dashboard Error: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default Dashboard;
