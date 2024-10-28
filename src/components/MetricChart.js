import React from 'react';
import { Chart, ArcElement, PieController, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

Chart.register(ArcElement, PieController, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MetricChart = () => {
  // Add console log to verify component rendering
  console.log('Rendering MetricChart');

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // SLA data including "About to Breach"
  const slaData = {
    labels: ['Met', 'In Progress', 'Breached', 'About to Breach (2hrs)'],
    datasets: [
      {
        label: 'SLA Performance',
        data: [40, 25, 20, 15], // Example dummy data
        backgroundColor: ['#4caf50', '#ffeb3b', '#f44336', '#ff9800'], // Colors for pie chart
      },
    ],
  };

  const barChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Tickets Met SLA',
        data: [20, 30, 40, 35],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Tickets Breached SLA',
        data: [5, 10, 15, 5],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
      {
        label: 'Tickets About to Breach SLA',
        data: [3, 5, 2, 4], // Example dummy data for about to breach
        backgroundColor: 'rgba(255, 152, 0, 0.6)', // Orange color for about to breach
      },
    ],
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Service Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">SLA Performance Pie Chart</h3>
          <Pie data={slaData} options={options} />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">SLA Performance Bar Chart</h3>
          <Bar data={barChartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default MetricChart;
