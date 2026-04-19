// src/components/ChartContainer.js
import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ChartContainer({ data }) {
  const chartRef = useRef();

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Цена закрытия',
        data: data.map(d => d.close),
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Важно для управления высотой через CSS
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Дата',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Цена',
        },
      },
    },
  };

  // Обновляем график при изменении данных
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = chartData;
      chartRef.current.update();
    }
  }, [data, chartData]); // Зависимости: если data или chartData меняются, эффект сработает

  if (data.length === 0) {
    return <p>Нет данных для отображения</p>;
  }

  return <Line ref={chartRef} data={chartData} options={options} />;
}

export default ChartContainer;