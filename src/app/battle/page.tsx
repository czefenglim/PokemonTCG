'use client';
import { useState } from 'react';

export default function BattleScreen() {
  const [message, setMessage] = useState('What will Snivy do?');
  const [enemyHP, setEnemyHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(100);
  const [isAttacking, setIsAttacking] = useState(false);
  const [hasSurrendered, setHasSurrendered] = useState(false);
  const [activePokemon, setActivePokemon] = useState('Snivy');

  const handleAttack = () => {
    if (hasSurrendered) return;

    setMessage(`${activePokemon} used Vine Whip!`);
    setIsAttacking(true);

    setTimeout(() => {
      setIsAttacking(false);
      setEnemyHP((prev) => Math.max(prev - 20, 0));
      setMessage("It's super effective!");
    }, 800);
  };

  const handleSwitch = () => {
    if (hasSurrendered) return;

    setActivePokemon('Bulbasaur');
    setPlayerHP(100); // reset HP
    setMessage('You switched to Bulbasaur!');
  };

  const handleSurrender = () => {
    setMessage('You surrendered. The battle is over.');
    setHasSurrendered(true);
  };

  const handlePass = () => {
    if (hasSurrendered) return;

    setMessage('You passed your turn.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800 text-white rounded-lg p-6 relative scale-105">
      {/* Opponent */}
      <div className="flex justify-between items-center bg-gray-900 p-4 rounded">
        <div>
          <p className="font-bold text-xl">Umbreon Lv.40</p>
          <div className="bg-gray-700 w-64 h-3 rounded mt-1">
            <div
              className="bg-green-500 h-3 rounded transition-all duration-500"
              style={{ width: `${enemyHP}%` }}
            ></div>
          </div>
        </div>
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png"
          alt="Umbreon"
          className={`w-28 h-28 ${isAttacking ? 'animate-ping' : ''}`}
        />
      </div>

      {/* Player */}
      <div className="flex justify-between items-center bg-gray-900 p-4 rounded mt-8">
        <img
          src={
            activePokemon === 'Snivy'
              ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/495.png'
              : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png'
          }
          alt={activePokemon}
          className={`w-28 h-28 transform transition-transform duration-300 ${
            isAttacking ? 'translate-x-6' : ''
          }`}
        />
        <div className="text-right">
          <p className="font-bold text-xl">{activePokemon} Lv.42</p>
          <div className="bg-gray-700 w-64 h-3 rounded ml-auto mt-1">
            <div
              className="bg-green-500 h-3 rounded transition-all duration-500"
              style={{ width: `${playerHP}%` }}
            ></div>
          </div>
          <p className="text-sm mt-1">HP: {playerHP}/100</p>
        </div>
      </div>

      {/* Message */}
      <div className="bg-black/70 p-4 mt-6 rounded text-lg min-h-[56px]">
        <p>{message}</p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button
          onClick={handleAttack}
          disabled={hasSurrendered}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-black font-bold py-3 text-lg rounded"
        >
          ATTACK
        </button>
        <button
          onClick={handleSwitch}
          disabled={hasSurrendered}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-black font-bold py-3 text-lg rounded"
        >
          SWITCH
        </button>
        <button
          onClick={handleSurrender}
          disabled={hasSurrendered}
          className="bg-gray-500 hover:bg-gray-600 text-black font-bold py-3 text-lg rounded"
        >
          SURRENDER
        </button>
        <button
          onClick={handlePass}
          disabled={hasSurrendered}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-black font-bold py-3 text-lg rounded"
        >
          PASS
        </button>
      </div>
    </div>
  );
}
