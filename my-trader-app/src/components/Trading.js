// src/components/Trading.js
import React, { useState } from 'react';

function Trading({ tradingState, handleBuyOrder, handleSellOrder }) { // Принимаем состояние и функции из App.js
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const handleAmountChange = (e) => setAmount(e.target.value);
  const handlePriceChange = (e) => setPrice(e.target.value);

  const executeBuy = () => {
    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(price);
    if (!isNaN(numAmount) && !isNaN(numPrice) && numAmount > 0 && numPrice > 0) {
      handleBuyOrder(numAmount, numPrice);
      setAmount(''); // Очищаем поля после выполнения
      setPrice('');
    }
  };

  const executeSell = () => {
    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(price);
    if (!isNaN(numAmount) && !isNaN(numPrice) && numAmount > 0 && numPrice > 0) {
      handleSellOrder(numAmount, numPrice);
      setAmount('');
      setPrice('');
    }
  };

  return (
    <div id="trading">
      <h1>Трейдинг</h1>
      <div className="trading-content">
        <div className="account-info">
          <h2>Демо-счет</h2>
          <p>Баланс: <span id="balance">{tradingState.balance.toFixed(2)}</span> USD</p>
          <p>Открытые позиции: <span id="positions">{tradingState.positions}</span></p>
        </div>
        <div className="trading-controls">
          <h2>Сделка</h2>
          <input
            type="number"
            placeholder="Количество"
            min="1"
            value={amount}
            onChange={handleAmountChange}
          />
          <input
            type="number"
            placeholder="Цена"
            step="0.01"
            value={price}
            onChange={handlePriceChange}
          />
          <button onClick={executeBuy}>Купить</button>
          <button onClick={executeSell}>Продать</button>
        </div>
        <div className="trading-log">
          <h2>Лог сделок</h2>
          <div id="trade-log">
            {tradingState.tradeLog.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trading;