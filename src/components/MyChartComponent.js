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
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  // Helper function to group tickets by day/month
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
          : date.toISOString().split("T")[0]; // YYYY-MM-DD

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

    // Destroy existing charts
    pieChartInstance.current?.destroy();
    barChartInstance.current?.destroy();

    // Pie chart: Priority distribution
    const priorityCounts = tickets.reduce((acc, ticket) => {
      const label =
        ticket.priority !== undefined ? `P${4 - ticket.priority}` : "Unknown";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const pieData = {
      labels: Object.keys(priorityCounts),
      datasets: [
        {
          data: Object.values(priorityCounts),
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ].slice(0, Object.keys(priorityCounts).length),
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ].slice(0, Object.keys(priorityCounts).length),
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

    // Bar chart: Time-based grouping
    const { labels, data } = groupTicketsByDate(tickets, dateField, groupBy);

    const barData = {
      labels,
      datasets: [
        {
          label: `Tickets by ${
            groupBy === "month" ? "Month" : "Day"
          } (${dateField})`,
          data,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
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
            text: `Ticket Volume Grouped by ${
              groupBy === "month" ? "Month" : "Day"
            } (${dateField})`,
          },
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
            },
          },
        },
      },
    });

    return () => {
      pieChartInstance.current?.destroy();
      barChartInstance.current?.destroy();
    };
  }, [tickets, groupBy, dateField]);

  return (
    <div className="flex flex-col md:flex-row justify-between">
      <div className="w-full md:w-1/2 p-2">
        <canvas ref={pieChartRef} id="myPieChart"></canvas>
      </div>
      <div className="w-full md:w-1/2 p-2">
        <canvas ref={barChartRef} id="myBarChart"></canvas>
      </div>
    </div>
  );
};

export default MyChartComponent;
