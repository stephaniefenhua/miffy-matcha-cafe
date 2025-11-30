const STYLES = {
  base: "rounded-xl shadow-lg text-center transition-all duration-300 relative p-6 pb-12",
  available: "bg-white border-4 border-gray-200 cursor-pointer transform hover:scale-105 hover:shadow-xl",
  selected: "border-4 border-green-700 bg-green-50 shadow-green-200 cursor-pointer transform hover:scale-105 hover:shadow-xl",
  unavailable: "opacity-60 cursor-not-allowed bg-gray-100 border-4 border-gray-300",
};

export default function DrinkCard({ 
  drink, 
  isSelected, 
  selectedSize,
  onCardClick, 
  onDeselect 
}) {
  const getCardClass = () => {
    if (!drink.is_available) return `${STYLES.base} ${STYLES.unavailable}`;
    if (isSelected) return `${STYLES.base} ${STYLES.selected}`;
    return `${STYLES.base} ${STYLES.available}`;
  };

  return (
    <div className={getCardClass()} onClick={onCardClick}>
      {/* Deselect Button */}
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

      {/* Drink Name */}
      <h2
        className={`text-lg font-bold mb-2 whitespace-nowrap ${
          !drink.is_available ? "text-gray-500" : "text-gray-800"
        }`}
      >
        {drink.name}
      </h2>

      {/* Description */}
      {drink.description && (
        <p
          className={`text-sm mt-2 text-left font-light leading-tight ${
            !drink.is_available ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {drink.description}
        </p>
      )}

      {/* Size Badge or Sold Out Badge - both at bottom center */}
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
}

