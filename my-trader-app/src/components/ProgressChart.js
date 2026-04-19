import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function ProgressChart({ completed, total, label }) {
  const data = {
    labels: ['Пройдено', 'Осталось'],
    datasets: [
      {
        data: [completed, total - completed],
        backgroundColor: ['#ff6b35', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
    },
  };

  return (
    <div className="progress-chart">
      <Doughnut data={data} options={options} />
      <div className="chart-label">
        <span className="chart-value">{completed}</span>
        <span className="chart-total">/{total}</span>
      </div>
      <p>{label}</p>
    </div>
  );
}

export default ProgressChart;