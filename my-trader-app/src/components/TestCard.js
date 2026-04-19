// src/components/TestCard.js
import React from 'react';
import './TestCard.css';

function TestCard({ moduleName, description, isCompleted, onStartTest }) {
  return (
    <div className="card" onClick={onStartTest}>
      {/* Шапка */}
      <div className="card-header">
        <div className="chart-bg"></div>
        <div className="header-title">{moduleName}</div>
        <div className={`status-badge ${isCompleted ? 'completed' : ''}`}>
          {isCompleted ? (
            <svg className="status-icon" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          ) : (
            <svg className="status-icon" viewBox="0 0 24 24">
              <path d="M18 10v-4c0-3.31-2.69-6-6-6s-6 2.69-6 6v4H4v10h16V10h-2zm-8-4c0-2.21 1.79-4 4-4s4 1.79 4 4v4h-8V6zm6 14h-4v-2h4v2z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Тело */}
      <div className="card-body">
        <p className="card-desc">{description}</p>
        <button className="btn-action">Начать тест</button>
      </div>
    </div>
  );
}

export default TestCard;