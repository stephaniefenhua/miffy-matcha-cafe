export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

