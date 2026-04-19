import React, { useState } from 'react';
import ModulesGrid from './ModulesGrid';

function Education({ progress, modules, toggleRead, updateTestProgress, testProgress, questions, switchTab }) {
  const [currentModuleName, setCurrentModuleName] = useState(null);
  const [currentTestModule, setCurrentTestModule] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [testState, setTestState] = useState('idle');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // для поиска

  const showModule = (moduleName) => {
    setCurrentModuleName(moduleName);
  };

  const goBack = () => {
    setCurrentModuleName(null);
    setCurrentTestModule(null);
    setTestState('idle');
    setSelectedAnswer(null);
  };

  const markAsRead = (moduleName) => {
    toggleRead(moduleName, true);
    goBack();
  };

  const startTest = (moduleName) => {
    setCurrentTestModule(moduleName);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTestState('question');
    setSelectedAnswer(null);
  };

  const checkAnswer = (selectedAnswerIndex) => {
    setSelectedAnswer(selectedAnswerIndex);
    const correctIndex = modules[currentTestModule].questions[currentQuestionIndex].correct;
    if (selectedAnswerIndex === correctIndex) {
      setScore(prevScore => prevScore + 1);
    }
    setTimeout(() => {
      if (currentQuestionIndex < modules[currentTestModule].questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedAnswer(null);
      } else {
        setTestState('result');
        updateTestProgress(currentTestModule, true);
      }
    }, 300);
  };

  const renderTestQuestion = () => {
    const question = modules[currentTestModule].questions[currentQuestionIndex];
    const total = modules[currentTestModule].questions.length;
    return (
      <div className="test-question-container">
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / total) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">{currentQuestionIndex + 1} / {total}</span>
        </div>
        <h3>{question.q}</h3>
        <div className="answers-grid">
          {question.a.map((ans, i) => (
            <div
              key={i}
              className={`answer-option ${selectedAnswer === i ? 'selected' : ''}`}
              onClick={() => {
                if (selectedAnswer === null) {
                  checkAnswer(i);
                }
              }}
            >
              <span className="answer-text">{ans}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTestResult = () => {
    const total = modules[currentTestModule].questions.length;
    const percentage = Math.round((score / total) * 100);
    let resultMessage = "";
    let resultColor = "";
    if (percentage >= 80) {
      resultMessage = "Отлично! Вы хорошо усвоили материал.";
      resultColor = "excellent";
    } else if (percentage >= 60) {
      resultMessage = "Хорошо! Но есть над чем поработать.";
      resultColor = "good";
    } else {
      resultMessage = "Повторите материал и попробуйте снова.";
      resultColor = "needs-work";
    }
    return (
      <div className="result-container">
        <h2>Тест завершен!</h2>
        <div className={`result-score ${resultColor}`}>
          <span className="score-number">{score}</span> из <span className="total-number">{total}</span>
        </div>
        <p className="result-message">{resultMessage}</p>
        <p className="result-percentage">Результат: <strong>{percentage}%</strong></p>
        <button className="back-to-modules-button" onClick={goBack}>
          Вернуться к модулям
        </button>
      </div>
    );
  };

  if (currentModuleName) {
    const moduleData = modules[currentModuleName];
    if (!moduleData) return <div>Модуль не найден</div>;
    const contentHtml = moduleData.content;
    const isCompleted = !!progress.modules[currentModuleName];
    const isTestPassed = !!testProgress.modules[currentModuleName];
    return (
      <div className="content-view">
        <h1>{currentModuleName}</h1>
        <div className="module-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        {!isCompleted && (
          <button onClick={() => markAsRead(currentModuleName)}>Отметить как прочитано</button>
        )}
        {isCompleted && !isTestPassed && (
          <button onClick={() => startTest(currentModuleName)}>Пройти тест</button>
        )}
        {isTestPassed && (
          <p style={{ color: '#32CD32' }}>✅ Тест пройден</p>
        )}
        <button onClick={goBack}>Вернуться к дашборду</button>
      </div>
    );
  }

  if (currentTestModule && testState === 'question') {
    return (
      <div className="test-container">
        <h1>Тестирование: {currentTestModule}</h1>
        {renderTestQuestion()}
      </div>
    );
  }

  if (currentTestModule && testState === 'result') {
    return (
      <div className="test-container">
        <h1>Результаты теста</h1>
        {renderTestResult()}
      </div>
    );
  }

  // Фильтрация модулей по поиску
  const filteredModules = Object.entries(modules).filter(([name, data]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (data.title && data.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredModulesObject = Object.fromEntries(filteredModules);

  return (
    <div id="education">
      <h1>Обучение</h1>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress.overall_progress}%` }}></div>
      </div>
      <input
        type="text"
        placeholder="Поиск модулей..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <ModulesGrid
        modules={filteredModulesObject}
        progress={progress}
        testProgress={testProgress}
        showModule={showModule}
        toggleRead={toggleRead}
        onStartTest={startTest}
        switchTab={switchTab}
      />
    </div>
  );
}

export default Education;