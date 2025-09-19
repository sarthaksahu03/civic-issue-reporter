import React, { useState } from 'react';
import ReCAPTCHA from './ReCAPTCHA';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const { login, googleSignIn, resetPassword } = useAuth();
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);
    const res = await resetPassword(resetEmail);
    setResetLoading(false);
    if (res.success) {
      setResetMsg('Password reset email sent! Check your inbox.');
    } else {
      setResetMsg(res.error || 'Failed to send reset email.');
    }
  };
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError('Please complete the CAPTCHA.');
      return;
    }
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

  // Admins now sign in via normal user sign-in; no separate handler needed

  return (
    <div className="w-full flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 space-y-6"
        aria-label="Login form"
      >
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-xl flex items-center justify-center mb-3">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">👁‍🗨</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sign in to continue to CivicEye</p>
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
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
        </div>
  <div className="my-4">
          <ReCAPTCHA siteKey={RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} />
        </div>
        <div className="text-right text-xs mb-2">
          <button
            type="button"
            className="text-primary hover:underline focus:outline-none"
            onClick={() => setShowReset(v => !v)}
          >
            Forgot password?
          </button>
        </div>
        {showReset && (
          <form onSubmit={handleReset} className="mb-4 p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-medium mb-1" htmlFor="reset-email">Enter your email to reset password:</label>
            <input
              id="reset-email"
              type="email"
              required
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="w-full mb-2"
            />
            <button
              type="submit"
              className="w-full bg-primary text-white py-1 rounded disabled:opacity-50"
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
            {resetMsg && <div className="mt-2 text-xs text-center text-green-600 dark:text-green-400">{resetMsg}</div>}
          </form>
        )}
        <div className="grid grid-cols-1 gap-3">
          <button
            type="submit"
            className="w-full bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
            disabled={loading || !captchaToken}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => googleSignIn()}
            className="w-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            disabled={loading}
          >
            Continue with Google
          </button>
        </div>
        <div className="text-center text-sm mt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary dark:text-primary-dark underline hover:no-underline">Register</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;