import React, { useEffect, useRef } from 'react';
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
} from 'chart.js';

// Register necessary Chart.js components
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

const MyChartComponent = () => {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

//   useEffect(() => {
//     const pieCtx = pieChartRef.current.getContext('2d');
//     const barCtx = barChartRef.current.getContext('2d');

//     // Destroy existing chart instances to prevent duplication
//     if (pieChartInstance.current) {
//       pieChartInstance.current.destroy();
//     }
//     if (barChartInstance.current) {
//       barChartInstance.current.destroy();
//     }

//     // -----------------------------
//     // Pie Chart Configuration
//     // -----------------------------
//     const pieData = {
//       labels: ['New Tickets', 'Critical', 'High', 'Breaching in 2hrs', 'Missed SLA'],
//       datasets: [
//         {
//           data: [120, 30, 50, 20, 10],
//           backgroundColor: [
//             'rgba(54, 162, 235, 0.6)',  // Blue for "New Tickets"
//             'rgba(255, 99, 132, 0.6)',  // Red for "Critical"
//             'rgba(255, 206, 86, 0.6)',  // Yellow for "High"
//             'rgba(75, 192, 192, 0.6)',  // Teal for "Breaching in 2hrs"
//             'rgba(153, 102, 255, 0.6)'  // Purple for "Missed SLA"
//           ],
//           borderColor: [
//             'rgba(54, 162, 235, 1)',
//             'rgba(255, 99, 132, 1)',
//             'rgba(255, 206, 86, 1)',
//             'rgba(75, 192, 192, 1)',
//             'rgba(153, 102, 255, 1)'
//           ],
//           borderWidth: 1,
//         },
//       ],
//     };

//     // Create Pie Chart
//     pieChartInstance.current = new Chart(pieCtx, {
//       type: 'pie',
//       data: pieData,
//       options: {
//         responsive: true,
//         plugins: {
//           legend: {
//             position: 'top',
//           },
//           title: {
//             display: true,
//             text: 'Incident Ticket Distribution',
//           },
//         },
//       },
//     });

//     // -----------------------------
//     // Bar Chart Configuration
//     // -----------------------------

//     // Option 1: Static Dummy Data for Bar Chart
//     const staticBarData = {
//       labels: [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ],
//       datasets: [
//         {
//           label: 'Monthly Tickets',
//           data: [120, 150, 180, 200, 220, 250, 230, 240, 260, 280, 290, 310],  // Example static data
//           backgroundColor: 'rgba(75, 192, 192, 0.5)',
//           borderColor: 'rgba(75, 192, 192, 1)',
//           borderWidth: 1,
//         },
//       ],
//     };

//     // Option 2: Randomized Data for Bar Chart
//     const generateRandomData = (min, max) => {
//       return Array.from({ length: 12 }, () => Math.floor(Math.random() * (max - min + 1)) + min);
//     };

//     const randomBarData = {
//       labels: [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ],
//       datasets: [
//         {
//           label: 'Monthly Tickets',
//           data: generateRandomData(50, 300),  // Generates random numbers between 50 and 300
//           backgroundColor: 'rgba(75, 192, 192, 0.5)',
//           borderColor: 'rgba(75, 192, 192, 1)',
//           borderWidth: 1,
//         },
//       ],
//     };

//     // Choose which data to use: staticBarData or randomBarData
//     const barData = randomBarData; // Use `staticBarData` if you prefer static data

//     // Create Bar Chart
//     barChartInstance.current = new Chart(barCtx, {
//       type: 'bar',
//       data: barData,
//       options: {
//         responsive: true,
//         plugins: {
//           legend: {
//             position: 'top',
//           },
//           title: {
//             display: true,
//             text: 'Monthly Ticket Overview',
//           },
//         },
//         scales: {
//           y: {
//             beginAtZero: true,
//             ticks: {
//               stepSize: 50, // Adjust based on your data range
//             },
//           },
//         },
//       },
//     });

//     // Cleanup function to destroy charts on unmount
//     return () => {
//       if (pieChartInstance.current) {
//         pieChartInstance.current.destroy();
//       }
//       if (barChartInstance.current) {
//         barChartInstance.current.destroy();
//       }
//     };
//   }, []);

useEffect(() => {
    const pieCtx = pieChartRef.current.getContext('2d');
    const barCtx = barChartRef.current.getContext('2d');
  
    // Destroy existing chart instances to prevent duplication
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }
  
    // -----------------------------
    // Pie Chart Configuration
    // -----------------------------
    const pieData = {
      labels: ['New Tickets', 'Critical', 'High', 'Breaching in 2hrs', 'Missed SLA'],
      datasets: [
        {
          data: [120, 30, 50, 20, 10],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',  // Blue for "New Tickets"
            'rgba(255, 99, 132, 0.6)',  // Red for "Critical"
            'rgba(255, 206, 86, 0.6)',  // Yellow for "High"
            'rgba(75, 192, 192, 0.6)',  // Teal for "Breaching in 2hrs"
            'rgba(153, 102, 255, 0.6)'  // Purple for "Missed SLA"
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
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
            text: 'Incident Ticket Distribution',
          },
        },
      },
    });
  
    // -----------------------------
    // Bar Chart Configuration (same data as pie chart)
    // -----------------------------
    const barData = {
      labels: ['New Tickets', 'Critical', 'High', 'Breaching in 2hrs', 'Missed SLA'],
      datasets: [
        {
          label: 'Ticket Count',
          data: [120, 30, 50, 20, 10],  // Same data as the pie chart
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',  // Blue for "New Tickets"
            'rgba(255, 99, 132, 0.6)',  // Red for "Critical"
            'rgba(255, 206, 86, 0.6)',  // Yellow for "High"
            'rgba(75, 192, 192, 0.6)',  // Teal for "Breaching in 2hrs"
            'rgba(153, 102, 255, 0.6)'  // Purple for "Missed SLA"
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
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
            text: 'Incident Ticket Distribution (Bar)',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  
    // Cleanup function to destroy charts on unmount
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, []);
  
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
