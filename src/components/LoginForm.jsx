import React from 'react';

const STYLES = {
  container: "min-h-screen flex items-center justify-center p-8",
  card: "bg-white rounded-xl shadow-2xl p-8 w-full max-w-md",
  heading: "text-3xl font-bold text-green-900 mb-6 text-center",
  input: "w-full p-4 border-4 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-green-600 transition",
  button: "w-full bg-green-700 text-white p-4 rounded-xl text-lg font-bold hover:bg-green-800 transition-all transform hover:scale-105",
};

export default function LoginForm({ email, password, onEmailChange, onPasswordChange, onSubmit }) {
  return (
    <div className={STYLES.container}>
      <div className={STYLES.card}>
        <h1 className={STYLES.heading}>admin login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={STYLES.input}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={STYLES.input}
            required
          />
          <button type="submit" className={STYLES.button}>
            login
          </button>
        </form>
      </div>
    </div>
  );
}

