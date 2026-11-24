import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBackToSite }) {
  const [email, setEmail] = useState('admin@rental.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.user.role !== 'admin') {
        throw new Error('Access denied: You do not have administrator permissions.');
      }

      localStorage.setItem('rental_token', data.token);
      localStorage.setItem('rental_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative animate-fadeIn">
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft size={14} /> Back to Customer Website
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Admin Control Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted access. Sign in to manage car fleet, 3D models & contacts.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rental.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Enter Admin Dashboard'}
          </button>
        </form>

        <div className="mt-6 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Sparkles size={13} className="text-indigo-400" /> Default credentials: 
          <strong className="text-slate-200">admin@rental.com</strong> / <strong className="text-slate-200">admin123</strong>
        </div>
      </div>
    </div>
  );
}
