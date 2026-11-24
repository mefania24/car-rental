import React from 'react';
import { Car, Phone, Mail, User, LogOut, ShieldCheck, CalendarCheck } from 'lucide-react';
import { Facebook } from './Icons';

export default function Navbar({
  user,
  adminContact,
  onOpenLogin,
  onLogout,
  currentView,
  setCurrentView
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Contact Strip */}
      {adminContact && (
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              {adminContact.phone && (
                <a
                  href={`tel:${adminContact.phone}`}
                  className="flex items-center gap-1.5 hover:text-indigo-400 transition"
                >
                  <Phone size={13} className="text-emerald-400" />
                  <span>{adminContact.phone}</span>
                </a>
              )}
              {adminContact.email && (
                <a
                  href={`mailto:${adminContact.email}`}
                  className="flex items-center gap-1.5 hover:text-indigo-400 transition"
                >
                  <Mail size={13} className="text-sky-400" />
                  <span>{adminContact.email}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-3">
              {adminContact.facebook && (
                <a
                  href={adminContact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-400 transition text-slate-400"
                >
                  <Facebook size={13} className="text-blue-500" />
                  <span>Facebook</span>
                </a>
              )}
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">{adminContact.businessHours || 'Open 24/7'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('catalog')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition transform">
            <Car size={22} />
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              PrimeAuto <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">3D</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Car Rental & Fleet</div>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              currentView === 'catalog' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Browse Cars
          </button>

          {user && (
            <button
              onClick={() => setCurrentView('my-bookings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'my-bookings' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CalendarCheck size={16} className="text-indigo-400" />
              <span>My Rentals</span>
            </button>
          )}

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
