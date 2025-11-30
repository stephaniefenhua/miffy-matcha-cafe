const BUTTON_STYLES = {
  primary: "bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl",
  secondary: "bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all",
  danger: "bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all",
  gray: "bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-all",
};

export default function Button({ 
  onClick, 
  variant = "primary", 
  children, 
  disabled, 
  className = "",
  type = "button"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BUTTON_STYLES[variant]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}

