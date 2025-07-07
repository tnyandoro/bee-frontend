import React from "react";
import Chart from "react-apexcharts";

const TicketsBarChart = ({ stats }) => {
  const options = {
    chart: { id: "tickets-bar", toolbar: { show: false } },
    xaxis: {
      categories: [
        "Total",
        "Open",
        "Closed",
        "Resolved", // ✅ Added
        "Problems",
        "Team Members",
      ],
    },
    colors: ["#3b82f6"],
    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: "Count",
      data: [
        stats.total_tickets,
        stats.open_tickets,
        stats.closed_tickets,
        stats.resolved_tickets, // ✅ Added
        stats.total_problems,
        stats.total_members,
      ],
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Tickets & Team Overview
      </h3>
      <Chart options={options} series={series} type="bar" height={300} />
    </div>
  );
};

export default TicketsBarChart;
