import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Sign in failed');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-background-dark">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-8 space-y-6"
        aria-label="Login form"
      >
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center mb-2">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in to your account</h2>
        </div>
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full"
            aria-label="Email address"
          />
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full"
            aria-label="Password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="text-center text-sm mt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary dark:text-primary-dark underline hover:no-underline">Register</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;