const SIZE_OPTIONS = {
  SMALL: { label: "small", value: "small", grams: "4 grams of matcha" },
  MEDIUM: { label: "medium", value: "medium", grams: "6 grams of matcha" },
};

const STYLES = {
  overlay: "fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out",
  content: "bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-gray-200 transition-all duration-300 ease-out transform",
};

export default function SizeSelectionModal({
  drink,
  isVisible,
  isSelectedDrink,
  onSizeSelect,
  onClose,
  onDeselect,
}) {
  if (!drink) return null;

  return (
    <div
      className={`${STYLES.overlay} ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
      onClick={onClose}
    >
      <div
        className={`${STYLES.content} ${
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{drink.name}</h2>
          {drink.description && (
            <p className="text-gray-600 mb-6 text-left font-normal">{drink.description}</p>
          )}

          <h3 className="text-lg font-semibold text-gray-700 mb-4">select size:</h3>

          <div className="space-y-3 mb-6">
            {Object.values(SIZE_OPTIONS).map((size) => (
              <button
                key={size.value}
                onClick={() => onSizeSelect(size.value)}
                className="w-full bg-white border-4 border-gray-300 hover:border-green-700 hover:bg-green-50 p-4 rounded-xl transition-all transform hover:scale-105"
              >
                <div className="font-bold text-lg text-gray-800">{size.label}</div>
                <div className="text-sm text-gray-600">{size.grams}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-semibold"
            >
              cancel
            </button>
            {isSelectedDrink && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={onDeselect}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  deselect drink
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SIZE_OPTIONS };

