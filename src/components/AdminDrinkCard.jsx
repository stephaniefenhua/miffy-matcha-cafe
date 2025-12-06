import React from 'react';

const STYLES = {
  card: "bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200",
  availability: {
    available: "bg-green-100 text-green-800",
    unavailable: "bg-gray-100 text-gray-800",
  },
  button: {
    edit: "px-4 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all",
    toggle: "px-4 py-2 rounded-lg font-semibold transition-all",
    delete: "px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all",
  },
};

export default function DrinkCard({ drink, onEdit, onToggleAvailability, onDelete }) {
  return (
    <div className={STYLES.card}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800">{drink.name}</h3>
          {drink.description ? (
            <p className="text-sm text-gray-600 mt-1 text-left font-light leading-tight">
              {drink.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic mt-1">No description</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            drink.is_available
              ? STYLES.availability.available
              : STYLES.availability.unavailable
          }`}
        >
          {drink.is_available ? "Available" : "Unavailable"}
        </span>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onEdit(drink)} className={STYLES.button.edit}>
          Edit
        </button>
        <button
          onClick={() => onToggleAvailability(drink.id, drink.is_available)}
          className={`${STYLES.button.toggle} ${
            drink.is_available
              ? "bg-gray-600 hover:bg-gray-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {drink.is_available ? "Mark Unavailable" : "Mark Available"}
        </button>
        <button
          onClick={() => onDelete(drink.id, drink.name)}
          className={STYLES.button.delete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
