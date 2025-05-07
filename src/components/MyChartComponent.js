import React, { useEffect, useRef } from 'react';
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
} from 'chart.js';

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

const MyChartComponent = ({ tickets }) => {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    if (!tickets || tickets.length === 0) return; // Wait for tickets data

    const pieCtx = pieChartRef.current.getContext('2d');
    const barCtx = barChartRef.current.getContext('2d');

    // Destroy existing chart instances to prevent duplication
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    // Calculate counts for pie chart (by priority)
    const priorityCounts = tickets.reduce((acc, ticket) => {
      const priorityLabel = ticket.priority !== undefined ? `P${4 - ticket.priority}` : 'Unknown';
      acc[priorityLabel] = (acc[priorityLabel] || 0) + 1;
      return acc;
    }, {});

    // Calculate counts for bar chart (by status)
    const statusCounts = tickets.reduce((acc, ticket) => {
      const status = ticket.status || 'Open';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Pie Chart Configuration (Priority Distribution)
    const pieData = {
      labels: Object.keys(priorityCounts),
      datasets: [
        {
          data: Object.values(priorityCounts),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',  // Blue
            'rgba(255, 99, 132, 0.6)',  // Red
            'rgba(255, 206, 86, 0.6)',  // Yellow
            'rgba(75, 192, 192, 0.6)',  // Teal
            'rgba(153, 102, 255, 0.6)', // Purple
          ].slice(0, Object.keys(priorityCounts).length), // Match label count
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ].slice(0, Object.keys(priorityCounts).length),
          borderWidth: 1,
        },
      ],
    };

    // Create Pie Chart
    pieChartInstance.current = new Chart(pieCtx, {
      type: 'pie',
      data: pieData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Ticket Distribution by Priority',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value} tickets`;
              },
            },
          },
        },
      },
    });

    // Bar Chart Configuration (Status Distribution)
    const barData = {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: 'Ticket Count by Status',
          data: Object.values(statusCounts),
          backgroundColor: 'rgba(75, 192, 192, 0.6)', // Consistent teal color
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Create Bar Chart
    barChartInstance.current = new Chart(barCtx, {
      type: 'bar',
      data: barData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Monthly Ticket Overview by Status',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value} tickets`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1, // Adjust based on ticket volume
            },
          },
        },
      },
    });

    // Cleanup on unmount
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [tickets]); // Re-run when tickets change

  return (
    <div className="flex flex-col md:flex-row justify-between">
      {/* Pie Chart Container */}
      <div className="w-full md:w-1/2 p-2">
        <canvas ref={pieChartRef} id="myPieChart"></canvas>
      </div>

      {/* Bar Chart Container */}
      <div className="w-full md:w-1/2 p-2">
        <canvas ref={barChartRef} id="myBarChart"></canvas>
      </div>
    </div>
  );
};

export default MyChartComponent;