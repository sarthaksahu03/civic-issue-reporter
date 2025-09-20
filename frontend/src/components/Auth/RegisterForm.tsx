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
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Password security requirements
  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
    { label: 'One symbol', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ];
  const passwordValid = passwordRequirements.every(req => req.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    if (!passwordValid) {
      setError('Password does not meet security requirements.');
      return;
    }
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
    <div className="w-full flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 space-y-6"
        aria-label="Register form"
      >
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center mb-2">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">👁‍🗨</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create your account</h2>
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              className="w-full pr-10"
              aria-label="Password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.1 2.1A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>
          {(passwordTouched || password) && (
            <ul className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              {passwordRequirements.map(req => (
                <li key={req.label} className={req.test(password) ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                  {req.label}
                </li>
              ))}
            </ul>
          )}
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
            onClick={() => googleSignIn()}
            className="w-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 py-2"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.243 29.196 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.084 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.084 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.138 0 9.826-1.969 13.385-5.182l-6.18-5.238C29.17 35.091 26.715 36 24 36c-5.176 0-9.594-3.777-10.966-8.857l-6.6 5.086C9.74 39.556 16.314 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.093 3.243-3.437 5.824-6.098 7.396.002-.001.003-.001.005-.002l6.18 5.238C34.95 41.121 44 36 44 24c0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            <span>Sign up with Google</span>
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