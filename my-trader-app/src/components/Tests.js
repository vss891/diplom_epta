// src/components/Tests.js
import React, { useState } from 'react';
import TestCard from './TestCard'; // Импортируем новый компонент
import './Tests.css'; // Убедитесь, что основные стили подключены

// Ваши вопросы (можно оставить как есть или добавить больше)
const questionsData = {
    "Начало начал": [
        { q: "Что такое трейдинг?", a: ["Покупка и продажа активов", "Игра в карты", "Спорт"], correct: 0 },
        { q: "Что такое рынок?", a: ["Место обмена товарами", "Парк", "Магазин"], correct: 0 }
    ],
    "Введение в графики": [
        { q: "Что показывает свеча?", a: ["Цену открытия и закрытия", "Время", "Объем"], correct: 0 }
    ],
    "Свечные паттерны": [
        { q: "Какой паттерн является бычьим?", a: ["Молот", "Повешенный", "Вечерняя звезда"], correct: 0 }
    ],
    "Графические формации": [
        { q: "Что показывает двойная вершина?", a: ["Разворот тренда", "Продолжение тренда", "Боковой тренд"], correct: 0 }
    ],
    "Индикаторы": [
        { q: "Что измеряет RSI?", a: ["Относительную силу", "Скользящую среднюю", "Объем"], correct: 0 }
    ],
    "Психология трейдинга": [
        { q: "Что нужно избегать в трейдинге?", a: ["Жадность", "Дисциплину", "План"], correct: 0 }
    ],
    "Риск-менеджмент": [
        { q: "Максимальный риск на сделку?", a: ["1-2%", "50%", "100%"], correct: 0 }
    ],
    "Стратегии торговли": [
        { q: "Что нужно тестировать?", a: ["Стратегии", "Эмоции", "Слухи"], correct: 0 }
    ]
};

// Краткие описания (добавьте все 8 модулей)
const moduleDescriptions = {
  "Начало начал": "Базовые понятия трейдинга и финансовых рынков.",
  "Введение в графики": "Основы свечей, объемов и чтения графиков.",
  "Свечные паттерны": "Анализ бычьих и медвежьих свечных формаций.",
  "Графические формации": "Разворотные и трендовые паттерны на графиках.",
  "Индикаторы": "Применение MA, RSI, MACD и других индикаторов.",
  "Психология трейдинга": "Управление эмоциями, дисциплина и когнитивные искажения.",
  "Риск-менеджмент": "Управление капиталом, размер позиции и стоп-лоссы.",
  "Стратегии торговли": "Разработка, тестирование и оптимизация стратегий."
};

function TestSelection({ onStartTest, testProgress }) {
  const moduleNames = Object.keys(questionsData);

  return (
    <div className="test-selection">
      <h2>Выберите модуль для тестирования</h2>
      <div className="test-cards-grid">
        {moduleNames.map(name => (
          <TestCard
            key={name}
            moduleName={name}
            description={moduleDescriptions[name] || "Описание теста."}
            isCompleted={!!testProgress?.modules?.[name]}
            onStartTest={() => onStartTest(name)}
          />
        ))}
      </div>
    </div>
  );
}

function Question({ question, onCheckAnswer, total, current }) {
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const handleSelect = (index) => {
        setSelectedAnswer(index);
    };

    const handleSubmit = () => {
        if (selectedAnswer !== null) {
            onCheckAnswer(selectedAnswer);
        }
    };

    return (
        <div className="question-container">
            <div className="progress-bar-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((current + 1) / total) * 100}%` }}
                    ></div>
                </div>
                <span className="progress-text">{current + 1} / {total}</span>
            </div>
            <h3>{question.q}</h3>
            <div className="answers-grid">
                {question.a.map((ans, i) => (
                    <div
                        key={i}
                        className={`answer-option ${selectedAnswer === i ? 'selected' : ''}`}
                        onClick={() => handleSelect(i)}
                    >
                        <span className="answer-text">{ans}</span>
                    </div>
                ))}
            </div>
            <button
                className="submit-answer-button"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
            >
                {current + 1 === total ? "Завершить тест" : "Далее"}
            </button>
        </div>
    );
}

function Result({ score, total, onBack }) {
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
            <button className="back-to-selection-button" onClick={onBack}>
                Назад к выбору модуля
            </button>
        </div>
    );
}

// --- Обновляем функцию Tests ---
function Tests({ testProgress, updateTestProgress }) { // Принимаем testProgress и updateTestProgress
    const [currentModule, setCurrentModule] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [testState, setTestState] = useState('selection'); // selection, question, result

    const startTest = (moduleName) => {
        if (!questionsData[moduleName] || !Array.isArray(questionsData[moduleName]) || questionsData[moduleName].length === 0) {
            alert(`Для модуля "${moduleName}" нет доступных вопросов для теста.`);
            return;
        }
        setCurrentModule(moduleName);
        setCurrentQuestionIndex(0);
        setScore(0);
        setTestState('question');
    };

    const checkAnswer = (selectedAnswerIndex) => {
        const correctIndex = questionsData[currentModule][currentQuestionIndex].correct;
        if (selectedAnswerIndex === correctIndex) {
            setScore(prevScore => prevScore + 1);
        }

        if (currentQuestionIndex < questionsData[currentModule].length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            setTestState('result');
            // --- Обновляем прогресс ---
            if (updateTestProgress) {
                updateTestProgress(currentModule, true);
            }
        }
    };

    const backToSelection = () => {
        setCurrentModule(null);
        setTestState('selection');
    };

    return (
        <div id="tests">
            <h1>Тестирование</h1>
            <div id="test-content">
                {testState === 'selection' && <TestSelection onStartTest={startTest} testProgress={testProgress} />} {/* Передаём testProgress */}
                {testState === 'question' && currentModule && (
                    <Question
                        question={questionsData[currentModule][currentQuestionIndex]}
                        onCheckAnswer={checkAnswer}
                        total={questionsData[currentModule].length}
                        current={currentQuestionIndex}
                    />
                )}
                {testState === 'result' && (
                    <Result
                        score={score}
                        total={questionsData[currentModule].length}
                        onBack={backToSelection}
                    />
                )}
            </div>
        </div>
    );
}

export default Tests;