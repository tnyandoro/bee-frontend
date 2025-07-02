import React, { useEffect, useRef } from "react";
import {
  Chart,
  ArcElement,
  PieController,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
Chart.register(
  ArcElement,
  PieController,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const MyChartComponent = ({
  tickets,
  groupBy = "day",
  dateField = "created_at",
}) => {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const categoryChartInstance = useRef(null);

  const groupTicketsByDate = (tickets, field, mode) => {
    const grouped = {};

    tickets.forEach((t) => {
      const dateStr = t[field] || t.created_at;
      const date = new Date(dateStr);
      if (isNaN(date)) return;

      const key =
        mode === "month"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              "0"
            )}`
          : date.toISOString().split("T")[0];

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .reduce(
        (acc, [label, value]) => {
          acc.labels.push(label);
          acc.data.push(value);
          return acc;
        },
        { labels: [], data: [] }
      );
  };

  useEffect(() => {
    if (!tickets || tickets.length === 0) return;

    const pieCtx = pieChartRef.current.getContext("2d");
    const barCtx = barChartRef.current.getContext("2d");
    const categoryCtx = categoryChartRef.current.getContext("2d");

    pieChartInstance.current?.destroy();
    barChartInstance.current?.destroy();
    categoryChartInstance.current?.destroy();

    // ✅ Fixed: Priority labels (P1 to P4)
    const priorityLabels = [
      "Critical (P1)", // 0
      "High (P2)", // 1
      "Medium (P3)", // 2
      "Low (P4)", // 3
    ];

    const priorityCounts = tickets.reduce((acc, ticket) => {
      const label =
        ticket.priority !== undefined
          ? priorityLabels[ticket.priority]
          : "Unknown";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const pieData = {
      labels: Object.keys(priorityCounts),
      datasets: [
        {
          data: Object.values(priorityCounts),
          backgroundColor: [
            "#f87171",
            "#fbbf24",
            "#facc15",
            "#34d399",
            "#a78bfa",
          ],
          borderColor: ["#ef4444", "#f59e0b", "#eab308", "#10b981", "#8b5cf6"],
          borderWidth: 1,
        },
      ],
    };

    pieChartInstance.current = new Chart(pieCtx, {
      type: "pie",
      data: pieData,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Ticket Distribution by Priority" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} tickets`,
            },
          },
        },
      },
    });

    // Bar Chart: Time series
    const { labels, data } = groupTicketsByDate(tickets, dateField, groupBy);
    const barData = {
      labels,
      datasets: [
        {
          label: `Tickets by ${groupBy === "month" ? "Month" : "Day"}`,
          data,
          backgroundColor: "#34d399",
          borderColor: "#059669",
          borderWidth: 1,
        },
      ],
    };

    barChartInstance.current = new Chart(barCtx, {
      type: "bar",
      data: barData,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: `Ticket Volume Grouped by ${groupBy} (${dateField})`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });

    // Category Chart: Ticket status + SLA
    const open = tickets.filter((t) => t.status === "open").length;
    const critical = tickets.filter((t) => t.priority === 0).length;
    const high = tickets.filter((t) => t.priority === 1).length;
    const breaching = tickets.filter(
      (t) => t.sla_breached && t.status !== "resolved"
    ).length;
    const missedSLA = tickets.filter((t) => t.sla_breached).length;

    const categoryData = {
      labels: ["Open", "Critical", "High", "About to Breach", "Missed SLA"],
      datasets: [
        {
          label: "Tickets by Category",
          data: [open, critical, high, breaching, missedSLA],
          backgroundColor: [
            "#60a5fa",
            "#f87171",
            "#fbbf24",
            "#fb923c",
            "#eab308",
          ],
          borderColor: ["#3b82f6", "#ef4444", "#f59e0b", "#f97316", "#ca8a04"],
          borderWidth: 1,
        },
      ],
    };

    categoryChartInstance.current = new Chart(categoryCtx, {
      type: "bar",
      data: categoryData,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Tickets by Category" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });

    return () => {
      pieChartInstance.current?.destroy();
      barChartInstance.current?.destroy();
      categoryChartInstance.current?.destroy();
    };
  }, [tickets, groupBy, dateField]);

  return (
    <div className="w-full flex flex-col items-center gap-6 mt-6 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* Pie Chart */}
        <div className="bg-white p-4 rounded shadow w-full aspect-square flex items-center justify-center">
          <canvas ref={pieChartRef}></canvas>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded shadow w-full aspect-square flex items-center justify-center">
          <canvas ref={barChartRef}></canvas>
        </div>
      </div>

      {/* Category Chart */}
      <div className="bg-white p-4 rounded shadow w-full max-w-5xl aspect-[2/1] flex items-center justify-center">
        <canvas ref={categoryChartRef}></canvas>
      </div>
    </div>
  );
};

export default MyChartComponent;
