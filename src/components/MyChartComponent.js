import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PieController,
  BarController,
  LineController,
  Filler, // Added Filler plugin
} from "chart.js";

// Register required controllers and elements, including Filler
ChartJS.register(
  PieController,
  BarController,
  LineController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MyChartComponent = ({ dashboardData }) => {
  const { charts, stats } = dashboardData || {};
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Clean up charts on unmount
  useEffect(() => {
    return () => {
      [pieChartInstance, barChartInstance, lineChartInstance].forEach((ref) => {
        ref.current?.destroy();
      });
    };
  }, []);

  // === Pie Chart: Tickets by Priority ===
  useEffect(() => {
    if (!dashboardData || !charts || !charts.tickets_by_priority) return;

    const ctx = pieChartRef.current?.getContext("2d");
    if (!ctx) return;

    pieChartInstance.current?.destroy();

    const priorityData = charts.tickets_by_priority;
    const labels = ["Critical (P1)", "High (P2)", "Medium (P3)", "Low (P4)"];
    const data = [
      priorityData.p1 || 0,
      priorityData.p2 || 0,
      priorityData.p3 || 0,
      priorityData.p4 || 0,
    ];

    // Only show chart if there's data
    const hasData = data.some((value) => value > 0);
    if (!hasData) {
      // Display "No data" message
      const canvas = pieChartRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "16px Arial";
      context.fillStyle = "#6B7280";
      context.textAlign = "center";
      context.fillText(
        "No priority data available",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    pieChartInstance.current = new ChartJS(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ["#f87171", "#fbbf24", "#facc15", "#34d399"],
            borderColor: ["#ef4444", "#f59e0b", "#eab308", "#10b981"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}: ${data.datasets[0].data[i]}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: data.datasets[0].borderWidth,
                  hidden: false,
                  index: i,
                }));
              },
            },
          },
          title: { display: true, text: "Tickets by Priority" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} tickets`,
            },
          },
        },
      },
    });
  }, [dashboardData, charts]);

  // === Bar Chart: Tickets by Status ===
  useEffect(() => {
    if (!dashboardData || !charts || !charts.tickets_by_status) return;

    const ctx = barChartRef.current?.getContext("2d");
    if (!ctx) return;

    barChartInstance.current?.destroy();

    const statusData = charts.tickets_by_status;
    const statusMap = {
      open: "Open",
      assigned: "Assigned",
      escalated: "Escalated",
      resolved: "Resolved",
      closed: "Closed",
      suspended: "Suspended",
      pending: "Pending",
    };

    // Filter out statuses with 0 tickets for cleaner display
    const nonZeroStatuses = Object.entries(statusData)
      .filter(([key, value]) => value > 0 && statusMap[key])
      .sort(([, a], [, b]) => b - a); // Sort by count descending

    if (nonZeroStatuses.length === 0) {
      // Display "No data" message
      const canvas = barChartRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "16px Arial";
      context.fillStyle = "#6B7280";
      context.textAlign = "center";
      context.fillText(
        "No status data available",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    const labels = nonZeroStatuses.map(([key]) => statusMap[key]);
    const data = nonZeroStatuses.map(([, value]) => value);

    barChartInstance.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Ticket Count",
            data,
            backgroundColor: "#60a5fa",
            borderColor: "#3b82f6",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Tickets by Status" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} tickets`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : null;
              },
            },
          },
        },
      },
    });
  }, [dashboardData, charts]);

  // === Line Chart: Top Assignees ===
  useEffect(() => {
    if (!dashboardData || !charts || !charts.top_assignees?.length) return;

    const ctx = lineChartRef.current?.getContext("2d");
    if (!ctx) return;

    lineChartInstance.current?.destroy();

    const assignees = charts.top_assignees.slice(0, 5); // Limit to top 5
    const labels = assignees.map((a) => a.name);
    const data = assignees.map((a) => a.tickets || a.count || 0);

    lineChartInstance.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Tickets Handled",
            data,
            fill: true,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderColor: "rgba(59, 130, 246, 1)",
            tension: 0.3,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Top Assignees" },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${context.raw} tickets`,
            },
          },
          filler: { propagate: true }, // Explicitly enable filler
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : null;
              },
            },
          },
        },
      },
    });
  }, [dashboardData, charts]);

  // Handle empty or invalid chart data
  if (
    !dashboardData ||
    !charts ||
    (!charts.tickets_by_priority &&
      !charts.tickets_by_status &&
      !charts.top_assignees)
  ) {
    return (
      <div className="text-center text-gray-500 my-8">
        <div className="bg-white p-8 rounded-lg shadow border">
          <p className="text-lg">
            No chart data available for this organization
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Charts will appear once there are tickets with proper status and
            priority data
          </p>
        </div>
      </div>
    );
  }

  // Check if any charts have data
  const hasPriorityData =
    charts.tickets_by_priority &&
    Object.values(charts.tickets_by_priority).some((val) => val > 0);
  const hasStatusData =
    charts.tickets_by_status &&
    Object.values(charts.tickets_by_status).some((val) => val > 0);
  const hasAssigneeData =
    charts.top_assignees && charts.top_assignees.length > 0;

  return (
    <div className="w-full flex flex-col gap-8 mt-6 px-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        {/* Pie Chart: Priority */}
        {hasPriorityData && (
          <div
            className="bg-white p-4 rounded-lg shadow"
            style={{ height: "400px" }}
          >
            <canvas ref={pieChartRef} />
          </div>
        )}

        {/* Show message if no priority data */}
        {!hasPriorityData && (
          <div className="bg-white p-4 rounded-lg shadow border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-lg font-medium">Priority Chart</p>
                <p className="text-sm">No priority data available</p>
              </div>
            </div>
          </div>
        )}

        {/* Bar Chart: Status */}
        {hasStatusData && (
          <div
            className="bg-white p-4 rounded-lg shadow"
            style={{ height: "400px" }}
          >
            <canvas ref={barChartRef} />
          </div>
        )}

        {/* Show message if no status data */}
        {!hasStatusData && (
          <div className="bg-white p-4 rounded-lg shadow border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-lg font-medium">Status Chart</p>
                <p className="text-sm">No status data available</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Line Chart: Top Assignees */}
      {hasAssigneeData && (
        <div
          className="bg-white p-4 rounded-lg shadow w-full max-w-6xl mx-auto"
          style={{ height: "400px" }}
        >
          <canvas ref={lineChartRef} />
        </div>
      )}

      {/* Show message if no assignee data */}
      {!hasAssigneeData && (
        <div className="bg-white p-4 rounded-lg shadow w-full max-w-6xl mx-auto border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-lg font-medium">Top Assignees Chart</p>
              <p className="text-sm">No assignee data available</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyChartComponent;
