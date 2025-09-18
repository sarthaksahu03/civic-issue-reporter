import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const { register, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await register(name, email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Registration failed');
      return;
    }
    if (result.requiresEmailConfirmation) {
      setInfo('Check your email to confirm your account before signing in.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-background-dark">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-8 space-y-6"
        aria-label="Register form"
      >
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center mb-2">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">📝</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create your account</h2>
        </div>
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        {info && <div className="text-green-600 text-sm" role="status">{info}</div>}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full"
            aria-label="Full name"
          />
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
            autoComplete="new-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full"
            aria-label="Password"
          />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <button
            type="submit"
            className="w-full bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => googleSignIn(false)}
            className="w-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            disabled={loading}
          >
            Sign up with Google
          </button>
          <button
            type="button"
            onClick={() => googleSignIn(true)}
            className="w-full border border-red-400 text-red-700 hover:bg-red-50"
            disabled={loading}
            title="Admin Google Sign-Up (for authorized admins)"
          >
            Admin Google Sign-Up
          </button>
        </div>
        <div className="text-center text-sm mt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-primary dark:text-primary-dark underline hover:no-underline">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;