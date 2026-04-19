import React, { useState } from 'react';
import ChartContainer from './ChartContainer';
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
  ScatterController,
} from 'chart.js';
import { Scatter as ScatterChart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController
);

const termColors = {
  'VL': 'rgb(255, 99, 132)',
  'L': 'rgb(255, 159, 64)',
  'M': 'rgb(255, 205, 86)',
  'H': 'rgb(75, 192, 192)',
  'VH': 'rgb(54, 162, 235)'
};

function FuzzyChart({ data }) {
  if (!data || data.length === 0) {
    return <p>Нет данных для отображения фаззификации.</p>;
  }

  const groupedByTerm = {};
  data.forEach(item => {
    if (!groupedByTerm[item.term]) {
      groupedByTerm[item.term] = [];
    }
    groupedByTerm[item.term].push({
      x: item.index,
      y: parseFloat(item.value),
      time_label: item.time_label
    });
  });

  const datasets = Object.keys(groupedByTerm).map(term => ({
    label: term,
    data: groupedByTerm[term],
    backgroundColor: termColors[term],
    borderColor: termColors[term],
    borderWidth: 1,
    pointRadius: 4,
  }));

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Фаззификация значений (Нечеткая логика)' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const point = context.raw;
            return `${context.dataset.label}: Значение=${point.y}, Время=${point.time_label}`;
          }
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Индекс (порядковый номер)' }, type: 'linear' },
      y: { title: { display: true, text: 'Значение' } },
    },
  };

  return <ScatterChart data={{ datasets }} options={options} />;
}

function ValidationErrorChart({ data }) {
  if (!data || data.length === 0) {
    return <p>Нет данных для графика ошибок валидации.</p>;
  }

  const points = data.map((item, index) => ({
    x: index,
    y: parseFloat(item.difference),
    time_label: item.time_label
  }));

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'График ошибок валидации (Разница прогноза и реального значения)' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const point = context.raw;
            return `Разница=${point.y}, Время=${point.time_label}`;
          }
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Индекс' }, type: 'linear' },
      y: { title: { display: true, text: 'Разница' } },
    },
  };

  return <ScatterChart data={{ datasets: [{ label: 'Ошибка', data: points, backgroundColor: 'red', pointRadius: 3 }] }} options={options} />;
}

function exportToCSV(data, filename) {
  const csvContent = data.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function Analysis({ loadData }) {
  const [fileStatus, setFileStatus] = useState('Файл не выбран');
  const [parsedData, setParsedData] = useState([]);
  const [fuzzyResults, setFuzzyResults] = useState(null);
  const [fuzzyLoading, setFuzzyLoading] = useState(false);
  const [fuzzyError, setFuzzyError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFileStatus('Файл не выбран');
      setParsedData([]);
      loadData([]);
      return;
    }
    setFileStatus('Загрузка...');
    const reader = new FileReader();
    reader.onload = function(e) {
      const csv = e.target.result;
      const data = parseCSV(csv);
      setParsedData(data);
      setFileStatus(`Загружено ${data.length} записей`);
      loadData(data);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv) => {
    const lines = csv.split('\n');
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].trim().split(',');
      if (cols.length >= 5) {
        data.push({
          date: cols[0],
          open: parseFloat(cols[1]),
          high: parseFloat(cols[2]),
          low: parseFloat(cols[3]),
          close: parseFloat(cols[4])
        });
      }
    }
    return data;
  };

  const triggerFileInput = () => {
    document.getElementById('ohlc-data-file-upload').click();
  };

  const handleFuzzyFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFuzzyError('Файл не выбран');
      setFuzzyResults(null);
      return;
    }

    setFuzzyLoading(true);
    setFuzzyError('');
    setFuzzyResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token'); // получаем токен
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // добавляем токен
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Неавторизован – можно выбросить пользователя на логин, но пока просто ошибка
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при анализе файла');
      }

      const data = await response.json();
      if (data.success) {
        setFuzzyResults(data);
      } else {
        setFuzzyError(data.error || 'Неизвестная ошибка');
      }
    } catch (err) {
      console.error("Ошибка при загрузке и анализе файла (нечеткий):", err);
      setFuzzyError(err.message || "Произошла ошибка при анализе файла.");
      setFuzzyResults(null);
    } finally {
      setFuzzyLoading(false);
    }
  };

  const triggerFuzzyFileInput = () => {
    document.getElementById('fuzzy-data-file-upload').click();
  };

  const renderVerificationTable = (data) => {
    if (!data || Object.keys(data).length === 0) return <p>Нет данных верификации.</p>;
    const groupedByLength = {};
    Object.keys(data).forEach(config => {
      const length = config.length;
      if (!groupedByLength[length]) groupedByLength[length] = [];
      groupedByLength[length].push({ config, ...data[config] });
    });

    return (
      <div>
        {Object.keys(groupedByLength).sort().map(length => (
          <div key={length} style={{ marginBottom: '20px' }}>
            <h4>Конфигурации длины {length}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#d5622d' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Конфигурация</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>VL</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>L</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>M</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>H</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>VH</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {groupedByLength[length].map((row, idx) => {
                  const total = row.VL + row.L + row.M + row.H + row.VH;
                  return (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.config}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.VL}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.L}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.M}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.H}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.VH}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        <button onClick={() => {
          const csvData = [['Конфигурация', 'VL', 'L', 'M', 'H', 'VH', 'Сумма']];
          Object.keys(data).forEach(config => {
            const row = data[config];
            const total = row.VL + row.L + row.M + row.H + row.VH;
            csvData.push([config, row.VL, row.L, row.M, row.H, row.VH, total]);
          });
          exportToCSV(csvData, 'verification.csv');
        }}>Экспорт в CSV</button>
      </div>
    );
  };

  const renderValidationTable = (data) => {
    if (!data || data.length === 0) return <p>Нет данных валидации.</p>;
    return (
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#d5622d' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Дата</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>L-конфигурация</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Прогнозное состояние</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Прогнозное значение</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Реальное значение</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Угадал</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Разница</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.time_label}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.l_config}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.predicted_state}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.forecast_value.toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.real_value.toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: row.guessed ? 'green' : 'red', color: 'white' }}>
                  {row.guessed ? 'Да' : 'Нет'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.difference.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => {
          const csvData = [['Дата', 'L-конфигурация', 'Прогнозное состояние', 'Прогнозное значение', 'Реальное значение', 'Угадал', 'Разница']];
          data.forEach(row => {
            csvData.push([row.time_label, row.l_config, row.predicted_state, row.forecast_value, row.real_value, row.guessed ? 'Да' : 'Нет', row.difference]);
          });
          exportToCSV(csvData, 'validation.csv');
        }}>Экспорт в CSV</button>
      </div>
    );
  };

  return (
    <div id="analysis">
      <h1>Анализ</h1>
      <div className="analysis-content">
        <div className="upload-section">
          <h2>Загрузка данных (CSV OHLC)</h2>
          <input
            type="file"
            id="ohlc-data-file-upload"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button onClick={triggerFileInput}>Выбрать файл (CSV OHLC)</button>
          <p id="file-status">{fileStatus}</p>
        </div>
        <div className="chart-container">
          <ChartContainer data={parsedData} />
        </div>
        <hr style={{ margin: '20px 0' }} />

        <div className="upload-section">
          <h2>Загрузка данных (CSV/XLSX - Нечеткая логика)</h2>
          <input
            type="file"
            id="fuzzy-data-file-upload"
            accept=".csv,.xlsx,.xls"
            onChange={handleFuzzyFileChange}
            style={{ display: 'none' }}
          />
          <button onClick={triggerFuzzyFileInput} disabled={fuzzyLoading}>
            {fuzzyLoading ? 'Идет анализ...' : 'Выбрать файл (CSV/XLSX)'}
          </button>
          {fuzzyError && <p style={{ color: 'red' }}>Ошибка: {fuzzyError}</p>}
        </div>

        {fuzzyResults && (
          <div className="fuzzy-analysis-results">
            <h2>Результаты фаззификации</h2>
            <div className="chart-container">
              <FuzzyChart data={fuzzyResults.fuzzification_data} />
            </div>
            <details style={{ marginTop: '20px' }}>
              <summary>Данные верификации (таблица)</summary>
              {renderVerificationTable(fuzzyResults.verification_data)}
            </details>
            <details style={{ marginTop: '20px' }}>
              <summary>Данные валидации (таблица)</summary>
              {renderValidationTable(fuzzyResults.validation_data)}
            </details>
            <details style={{ marginTop: '20px' }}>
              <summary>График ошибок валидации</summary>
              <ValidationErrorChart data={fuzzyResults.validation_data} />
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analysis;