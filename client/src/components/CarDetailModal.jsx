import React, { useState } from 'react';
import {
  X,
  Users,
  Wind,
  Gauge,
  Fuel,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Facebook } from './Icons';
import Car3DViewer from './Car3DViewer';

export default function CarDetailModal({
  car,
  adminContact,
  user,
  onClose,
  onBookSuccess
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Calculate days & total
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const days = calculateDays();
  const totalPrice = days * (car?.pricePerDay || 0);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          startDate,
          endDate,
          totalDays: days,
          notes,
          userId: user?.id || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reservation');
      }

      setBookingSuccess(true);
      if (onBookSuccess) onBookSuccess(data.booking);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              {car.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {car.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto space-y-8">
          {/* 1. 3D Model Showcase */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" />
                Live 3D Exterior Inspection
              </span>
              <span className="text-xs text-slate-400">Use mouse or finger to rotate 360°</span>
            </div>
            <Car3DViewer car={car} height="400px" />
          </div>

          {/* 2. Specs and Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Users size={20} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Capacity</div>
                <div className="text-sm font-bold text-white">{car.seats} Passengers</div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Wind size={20} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Air Conditioner</div>
                <div className="text-sm font-bold text-white">
                  {car.airConditioned ? 'Dual Climate A/C' : 'Standard'}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Gauge size={20} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Transmission</div>
                <div className="text-sm font-bold text-white">{car.transmission}</div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Fuel size={20} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Fuel Type</div>
                <div className="text-sm font-bold text-white">{car.fuel}</div>
              </div>
            </div>
          </div>

          {/* 3. Description & Highlights */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Vehicle Highlights & Comfort
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {car.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {car.features && car.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl font-medium"
                >
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Booking Form & Direct Admin Contact */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-2">
            {/* Booking Form (Left 3 cols) */}
            <div className="lg:col-span-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h4 className="text-lg font-bold text-white">Reserve This Car</h4>
                  <p className="text-xs text-slate-400">Instant reservation request</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-400">${car.pricePerDay}</div>
                  <div className="text-[11px] text-slate-400">per day</div>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Booking Request Sent!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Thank you! Our admin has received your reservation request for the {car.name} and will contact you via phone/email shortly to confirm pick-up details.
                  </p>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="text-xs text-indigo-400 hover:underline pt-2 font-medium"
                  >
                    Submit another booking
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4">
                  {bookingError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                      {bookingError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Pick-up Date</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Return Date</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Required)</label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Preferences (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="e.g., Need baby seat, airport pickup, driver assistance"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Total duration: </span>
                      <span className="font-semibold text-white">{days} Day{days > 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Est. Total: </span>
                      <span className="font-bold text-emerald-400 text-sm">${totalPrice}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm"
                  >
                    {bookingLoading ? 'Submitting Reservation...' : 'Confirm Rental Reservation'}
                  </button>
                </form>
              )}
            </div>

            {/* Direct Admin Contacts (Right 2 cols) */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck size={16} />
                  Direct Admin Assistance
                </div>
                <h4 className="text-base font-bold text-white mb-2">
                  Need Quick Booking or Have Questions?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You can reach the car rental owner directly right now via phone, Facebook messenger, or email:
                </p>
              </div>

              {adminContact && (
                <div className="space-y-3">
                  {adminContact.phone && (
                    <a
                      href={`tel:${adminContact.phone}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition group"
                    >
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                        <Phone size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Call / WhatsApp</div>
                        <div className="text-xs font-bold text-white truncate">{adminContact.phone}</div>
                      </div>
                    </a>
                  )}

                  {adminContact.facebook && (
                    <a
                      href={adminContact.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition group"
                    >
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
                        <Facebook size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Facebook Page</div>
                        <div className="text-xs font-bold text-white truncate">Message on Facebook</div>
                      </div>
                    </a>
                  )}

                  {adminContact.email && (
                    <a
                      href={`mailto:${adminContact.email}?subject=Car Rental Inquiry - ${encodeURIComponent(car.name)}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-800 transition group"
                    >
                      <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition">
                        <Mail size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Gmail / Email</div>
                        <div className="text-xs font-bold text-white truncate">{adminContact.email}</div>
                      </div>
                    </a>
                  )}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <CreditCard size={14} className="text-indigo-400" />
                  No Upfront Payment Required
                </div>
                <div>Pay when inspecting and collecting vehicle keys.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
