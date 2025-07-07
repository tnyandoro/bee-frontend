import React from "react";
import Chart from "react-apexcharts";

const TicketsBarChart = ({ stats }) => {
  const options = {
    chart: { id: "tickets-bar", toolbar: { show: false } },
    xaxis: {
      categories: [
        "Total",
        "Open",
        "Assigned",
        "Escalated",
        "Resolved",
        "Closed",
        "Problems",
        "Team Members",
      ],
    },
    colors: ["#3b82f6"],
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: "45%",
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} ticket${val !== 1 ? "s" : ""}`,
      },
    },
    theme: {
      palette: "palette1",
    },
  };

  const series = [
    {
      name: "Count",
      data: [
        stats.total_tickets ?? 0,
        stats.open_tickets ?? 0,
        stats.assigned_tickets ?? 0,
        stats.escalated_tickets ?? 0,
        stats.resolved_tickets ?? 0,
        stats.closed_tickets ?? 0,
        stats.total_problems ?? 0,
        stats.total_members ?? 0,
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
