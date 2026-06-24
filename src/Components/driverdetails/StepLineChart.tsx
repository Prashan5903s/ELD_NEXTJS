// import React from 'react';
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const ChartComponent: React.FC = () => {
//   const data = {
//     labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//     datasets: [
//       {
//         label: 'Sales',
//         data: [65, 59, 80, 81, 56, 55, 40],
//         fill: false,
//         borderColor: 'rgba(75,192,192,1)',
//         tension: 0.1,
//       },
//     ],
//   };

//   const options = {
//     maintainAspectRatio: false,
//     scales: {
//       y: {
//         ticks: {
//           stepSize: 10,
//           callback: (value, index, values) => {
//             switch (value) {
//               case 1: return "ON";
//               case 2: return "D";
//               case 3: return "SB";
//               case 4: return "OFF";
//               default: return "";
//             }
//           }
//         }
//       },
//       x: {
//         position: 'bottom', // or any valid position like 'top', 'left', 'right', 'bottom'
//         ticks: {
//           stepSize: 1,
//           callback: (value, index, values) => value.toString()
//         }
//       }
//     },
//   };

//   return (
//     <div>
//       <Line data={data} />
//     </div>
//   );
// };

// export default ChartComponent;


import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent: React.FC = () => {
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Sales',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          stepSize: 10,
          callback: (value, index, values) => {
            switch (value) {
              case 1: return "ON";
              case 2: return "D";
              case 3: return "SB";
              case 4: return "OFF";
              default: return "";
            }
          }
        }
      },
      x: {
        position: 'bottom', // or any valid position like 'top', 'left', 'right', 'bottom'
        ticks: {
          stepSize: 1,
          callback: (value, index, values) => value.toString()
        }
      }
    },
  };

  return (
    <div>
      <Line data={data} />
    </div>
  );
};

export default ChartComponent;
