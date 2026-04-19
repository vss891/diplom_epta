// src/components/ModulesGrid.js
import React from 'react';
import ModuleCard from './ModuleCard';

function ModulesGrid({ modules, progress, testProgress, showModule, toggleRead, onStartTest }) {
  console.log('Modules in ModulesGrid:', modules);
  console.log('Entries:', Object.entries(modules));

  if (!modules || Object.keys(modules).length === 0) {
    return <div>Модули загружаются или не найдены.</div>;
  }

  return (
    <div className="modules-grid" id="modules-grid">
      {Object.entries(modules).map(([name, data]) => (
        <ModuleCard
          key={name}
          moduleName={name}
          moduleData={data}
          isCompleted={!!progress.modules[name]}
          isTestPassed={!!testProgress.modules[name]}
          onStudyClick={(isChecked) => toggleRead(name, isChecked)} // Для галочки "Прочитано"
          onTestClick={() => onStartTest(name)} // Для кнопки "Пройти тест" - вызывает startTest в Education
          showModule={showModule} // <-- Передаём showModule
        />
      ))}
    </div>
  );
}

export default ModulesGrid;