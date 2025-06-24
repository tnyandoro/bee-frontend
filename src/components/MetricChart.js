import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Pie, Bar } from "react-chartjs-2";
import { useAuth } from "../contexts/authContext";

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

const options = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

// Specific options for pie chart to make it smaller
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

const slaData = {
  labels: ["Met", "In Progress", "Breached", "About to Breach (2hrs)"],
  datasets: [
    {
      label: "SLA Performance",
      data: [40, 25, 20, 15],
      backgroundColor: ["#4caf50", "#ffeb3b", "#f44336", "#ff9800"],
    },
  ],
};

const barChartData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "Tickets Met SLA",
      data: [20, 30, 40, 35],
      backgroundColor: "rgba(75, 192, 192, 0.6)",
    },
    {
      label: "Tickets Breached SLA",
      data: [5, 10, 15, 5],
      backgroundColor: "rgba(255, 99, 132, 0.6)",
    },
    {
      label: "Tickets About to Breach SLA",
      data: [3, 5, 2, 4],
      backgroundColor: "rgba(255, 152, 0, 0.6)",
    },
  ],
};

const MetricChart = () => {
  const { currentUser, token, subdomain } = useAuth();
  const [roleOptions, setRoleOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const navigate = useNavigate();

  // Show intent to use these variables
  useEffect(() => {
    if (currentUser && token) {
      // console.log("User authenticated:", currentUser.name || currentUser.email);
      setRolesLoading(true);

      // TODO: Implement role fetching logic here
      // Simulate fetching roles for the subdomain
      const fetchRoles = async () => {
        try {
          // Mock API call - replace with actual API
          const mockRoles = [
            { id: 1, name: "Admin", permissions: ["read", "write", "delete"] },
            { id: 2, name: "User", permissions: ["read"] },
            { id: 3, name: "Manager", permissions: ["read", "write"] },
          ];

          setRoleOptions(mockRoles);
          setRolesLoading(false);
          // console.log("Roles loaded for subdomain:", subdomain, mockRoles);
        } catch (error) {
          // console.error("Error fetching roles:", error);
          setRolesLoading(false);
        }
      };

      fetchRoles();
    }
  }, [currentUser, token, subdomain]);

  // Handle authentication state
  useEffect(() => {
    if (!currentUser && !rolesLoading) {
      // console.log("No user found, redirecting to login");
      navigate("/login"); // Uncomment when ready to implement
    }
  }, [currentUser, rolesLoading, navigate]);

  // Use roleOptions in component logic
  useEffect(() => {
    if (roleOptions.length > 0) {
      console.log(
        "Available roles:",
        roleOptions.map((role) => role.name)
      );
      // TODO: Use roles for permission-based UI rendering
    }
  }, [roleOptions]);

  console.log("Rendering MetricChart for user:", !!currentUser);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Service Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart with fixed height */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">
            SLA Performance Pie Chart
          </h3>
          <div className="h-64">
            <Pie data={slaData} options={pieOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">
            SLA Performance Bar Chart
          </h3>
          <Bar data={barChartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default MetricChart;
