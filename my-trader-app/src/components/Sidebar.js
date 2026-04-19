// src/components/Sidebar.js
import React from 'react';

function Sidebar({ activeTab, switchTab, isSidebarHidden, toggleSidebar }) {
  const tabs = [
    { id: 'education', label: 'Обучение' },
    { id: 'tests', label: 'Тесты' },
    { id: 'analysis', label: 'Анализ' },
    { id: 'trading', label: 'Трейдинг' },
  ];

  return (
    <>
      <button
        className={`sidebar-open-btn ${!isSidebarHidden ? 'hidden' : ''}`}
        onClick={toggleSidebar}
      >
        ☰
      </button>
      <div className={`sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>Trader App</h2>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              ☰
            </button>
          </div>
          <ul>
            {tabs.map(tab => (
              <li key={tab.id}>
                <a
                  href="#"
                  className={`tab-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    switchTab(tab.id);
                  }}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;