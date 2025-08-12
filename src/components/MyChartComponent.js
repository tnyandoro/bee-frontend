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

    // Normalize priority keys (handle p1/p2/p3/p4 or Critical/High/Medium/Low)
    const priorityMap = {
      p1: "Critical (P1)",
      p2: "High (P2)",
      p3: "Medium (P3)",
      p4: "Low (P4)",
      Critical: "Critical (P1)",
      High: "High (P2)",
      Medium: "Medium (P3)",
      Low: "Low (P4)",
    };

    const labels = ["Critical (P1)", "High (P2)", "Medium (P3)", "Low (P4)"];
    const data = labels.map((label) => {
      const key = Object.keys(charts.tickets_by_priority).find(
        (k) => priorityMap[k] === label
      );
      return charts.tickets_by_priority[key] || 0;
    });

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
        plugins: {
          legend: { position: "right" },
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

    const statusMap = {
      open: "Open",
      assigned: "Assigned",
      escalated: "Escalated",
      resolved: "Resolved",
      closed: "Closed",
    };

    const labels = Object.keys(charts.tickets_by_status)
      .filter((key) => statusMap[key])
      .map((key) => statusMap[key]);

    const data = labels.map((label) => {
      const key = Object.keys(charts.tickets_by_status).find(
        (k) => statusMap[k] === label
      );
      return charts.tickets_by_status[key] || 0;
    });

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
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Tickets by Status" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
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

    const labels = charts.top_assignees.map((a) => a.name);
    const data = charts.top_assignees.map((a) => a.tickets || a.count || 0); // Handle tickets or count

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
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Top Assignees" },
          filler: { propagate: true }, // Explicitly enable filler
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
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
        No chart data available for this organization
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 mt-6 px-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        {/* Pie Chart: Priority */}
        {charts.tickets_by_priority && (
          <div className="bg-white p-4 rounded-lg shadow">
            <canvas ref={pieChartRef} />
          </div>
        )}

        {/* Bar Chart: Status */}
        {charts.tickets_by_status && (
          <div className="bg-white p-4 rounded-lg shadow">
            <canvas ref={barChartRef} />
          </div>
        )}
      </div>

      {/* Line Chart: Top Assignees */}
      {charts.top_assignees?.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow w-full max-w-6xl mx-auto aspect-video">
          <canvas ref={lineChartRef} />
        </div>
      )}
    </div>
  );
};

export default MyChartComponent;
