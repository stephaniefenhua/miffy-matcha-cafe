import React from 'react';

const STYLES = {
  container: "bg-white p-6 rounded-xl shadow-lg border-2 border-green-200 mb-6",
  input: "w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200",
  label: "block text-sm font-semibold text-gray-700 mb-1",
  button: "w-full bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
};

export default function AddDrinkForm({ drink, onDrinkChange, onAdd }) {
  return (
    <div className={STYLES.container}>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Drink</h3>
      <div className="space-y-4">
        <div>
          <label className={STYLES.label}>Drink Name *</label>
          <input
            type="text"
            value={drink.name}
            onChange={(e) => onDrinkChange({ ...drink, name: e.target.value })}
            placeholder="e.g., Matcha Latte"
            className={STYLES.input}
          />
        </div>
        <div>
          <label className={STYLES.label}>Description</label>
          <input
            type="text"
            value={drink.description}
            onChange={(e) => onDrinkChange({ ...drink, description: e.target.value })}
            placeholder="e.g., Creamy matcha with oat milk"
            className={STYLES.input}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_available"
            checked={drink.is_available}
            onChange={(e) => onDrinkChange({ ...drink, is_available: e.target.checked })}
            className="w-5 h-5"
          />
          <label htmlFor="is_available" className="text-sm font-semibold text-gray-700">
            Available for ordering
          </label>
        </div>
        <button
          onClick={onAdd}
          disabled={!drink.name}
          className={STYLES.button}
        >
          Add Drink
        </button>
      </div>
    </div>
  );
}

