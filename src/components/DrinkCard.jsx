import React from 'react';
import Button from './Button';

const DrinkCard = ({ drink, isSelected, selectedSize, onCardClick, onDeselect }) => {
  const getDrinkCardClass = () => {
    const base = "rounded-xl shadow-lg text-center transition-all duration-300 relative p-6 pb-12";
    if (!drink.is_available) {
      return `${base} opacity-60 cursor-not-allowed bg-gray-100 border-4 border-gray-300`;
    }
    if (isSelected) {
      return `${base} border-4 border-green-700 bg-green-50 shadow-green-200 cursor-pointer transform hover:scale-105 hover:shadow-xl`;
    }
    return `${base} bg-white border-4 border-gray-200 cursor-pointer transform hover:scale-105 hover:shadow-xl`;
  };

  return (
    <div className={getDrinkCardClass()} onClick={onCardClick}>
      {isSelected && drink.is_available && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeselect();
            }}
            className="bg-green-600 hover:bg-green-700 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors"
            title="Deselect this drink"
          >
            ×
          </button>
        </div>
      )}
      <h2 className={`text-lg font-bold mb-2 whitespace-nowrap ${!drink.is_available ? "text-gray-500" : "text-gray-800"}`}>
        {drink.name}
      </h2>
      {drink.description && (
        <p className={`text-sm mt-2 text-left font-light leading-tight ${!drink.is_available ? "text-gray-400" : "text-gray-600"}`}>
          {drink.description}
        </p>
      )}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
        {!drink.is_available ? (
          <span className="inline-block bg-gray-500 text-white px-4 py-1 rounded-full text-xs font-bold">
            SOLD OUT
          </span>
        ) : (
          isSelected && selectedSize && (
            <span className="inline-block bg-green-700 text-white px-4 py-1 rounded-full text-xs font-bold">
              {selectedSize}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default DrinkCard;
