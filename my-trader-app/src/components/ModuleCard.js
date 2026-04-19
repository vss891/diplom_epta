// src/components/ModuleCard.js
import React from 'react';

function ModuleCard({ moduleName, moduleData, isCompleted, isTestPassed, onStudyClick, onTestClick, showModule }) { // Принимаем showModule
  if (!moduleData) {
    console.error(`ModuleCard: moduleData is undefined for moduleName: ${moduleName}`);
    return <div className="module-card error">Ошибка: Данные модуля отсутствуют ({moduleName})</div>;
  }

  const title = moduleData.title;

  return (
    <div className={`module-card ${isCompleted ? 'completed' : ''}`}>
      <h3>{isCompleted ? '✓ ' : ''}{title}</h3>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(e) => onStudyClick(e.target.checked)}
        />
        Прочитано
      </label>
      {isCompleted && (
        <button
          className="test-button"
          onClick={onTestClick} // Вызываем onTestClick для запуска теста
        >
          {isTestPassed ? '✅ Тест пройден' : '📝 Пройти тест'}
        </button>
      )}
      {/* Изменяем onClick для кнопки "Изучить" */}
      <button onClick={() => showModule(moduleName)} className="study-button"> {/* Вызываем showModule */}
        Изучить
      </button>
    </div>
  );
}

export default ModuleCard;