import React from 'react';

const STYLES = {
  overlay: "fixed inset-0 flex items-center justify-center z-50 p-4",
  modal: "bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-gray-200",
  input: "w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200",
  textarea: "w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 text-sm font-light leading-tight text-gray-600",
  label: "block text-sm font-semibold text-gray-700 mb-1",
  button: {
    save: "flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all",
    cancel: "px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all",
  },
};

export default function EditDrinkModal({ drink, formData, onClose, onSave, onFormChange }) {
  return (
    <div
      className={STYLES.overlay}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={onClose}
    >
      <div
        className={STYLES.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Drink</h2>
        
        <div className="space-y-4">
          <div>
            <label className={STYLES.label}>Drink Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              className={STYLES.input}
            />
          </div>
          
          <div>
            <label className={STYLES.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              rows="4"
              className={STYLES.textarea}
              placeholder="Enter drink description..."
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onSave} className={STYLES.button.save}>
            Save Changes
          </button>
          <button onClick={onClose} className={STYLES.button.cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

