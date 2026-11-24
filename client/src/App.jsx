import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CarDetailModal from './components/CarDetailModal';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import {
  Car,
  Search,
  Filter,
  Users,
  Wind,
  Gauge,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Facebook } from './components/Icons';

const CATEGORIES = ['All', 'Van', 'SUV', 'Sedan', 'Sports'];

export default function App() {
  const [cars, setCars] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' | 'admin' | 'my-bookings'
  const [selectedCar, setSelectedCar] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [minSeats, setMinSeats] = useState('');
  
  // My Bookings
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Restore auth from local storage
  useEffect(() => {
    const savedToken = localStorage.getItem('rental_token');
    const savedUser = localStorage.getItem('rental_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch cars and contact info
  const fetchCars = async () => {
    try {
      let url = '/api/cars?';
      if (selectedCategory !== 'All') url += `category=${selectedCategory}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (minSeats) url += `minSeats=${minSeats}&`;

      const res = await fetch(url);
      const data = await res.json();
      setCars(data.cars || []);
    } catch (err) {
      console.error('Error fetching cars:', err);
    }
  };

  const fetchContact = async () => {
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      if (data.contact) setAdminContact(data.contact);
    } catch (err) {
      console.error('Error fetching contact:', err);
    }
  };

  const fetchMyBookings = async () => {
    if (!token) return;
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMyBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [selectedCategory, searchQuery, minSeats]);

  useEffect(() => {
    fetchContact();
  }, []);

  useEffect(() => {
    if (currentView === 'my-bookings' && token) {
      fetchMyBookings();
    }
  }, [currentView, token]);

  const handleLogout = () => {
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
    setUser(null);
    setToken('');
    setCurrentView('catalog');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navbar with Admin Contacts */}
      <Navbar
        user={user}
        adminContact={adminContact}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* MAIN VIEW CONTROLLER */}
      {currentView === 'admin' && user?.role === 'admin' ? (
        <AdminDashboard token={token} onCarUpdated={fetchCars} />
      ) : currentView === 'my-bookings' ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-white">My Rental Reservations</h1>
            <button
              onClick={() => setCurrentView('catalog')}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              ← Back to Catalog
            </button>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-slate-400">Loading your reservations...</div>
          ) : myBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
              <Calendar size={40} className="mx-auto text-slate-600" />
              <h3 className="text-lg font-bold text-white">No active reservations found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore our catalog of 8-seater vans, SUVs, and luxury sedans with live 3D preview!
              </p>
              <button
                onClick={() => setCurrentView('catalog')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Browse Cars
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBookings.map((b) => (
                <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">{b.carName}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        b.status === 'Confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div>
                      <span className="text-slate-500">Pick-up:</span> <strong className="text-slate-300">{b.startDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Return:</span> <strong className="text-slate-300">{b.endDate}</strong> ({b.totalDays} days)
                    </div>
                    <div>
                      <span className="text-slate-500">Total Price:</span>{' '}
                      <strong className="text-emerald-400 text-sm">${b.totalPrice}</strong>
                    </div>
                  </div>

                  {adminContact && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Questions?</span>
                      <a href={`tel:${adminContact.phone}`} className="text-indigo-400 hover:underline font-medium">
                        Call {adminContact.phone}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CATALOG VIEW */
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-400 shadow-inner">
                <Sparkles size={14} /> Next-Gen 3D Vehicle Fleet Experience
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
                Rent Comfortably. <br />
                <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                  Inspect in Real-Time 3D.
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Choose from 8-seater spacious family vans, executive sedans, and high-clearance SUVs. 
                Equipped with dual air-conditioning, maximum seating comfort, and verified reliability.
              </p>

              {/* Direct Admin Contact Strip in Hero */}
              {adminContact && (
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="text-slate-400">Immediate booking hotline:</span>
                  <a
                    href={`tel:${adminContact.phone}`}
                    className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full font-bold transition"
                  >
                    <Phone size={13} /> {adminContact.phone}
                  </a>
                  {adminContact.facebook && (
                    <a
                      href={adminContact.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-full font-semibold transition"
                    >
                      <Facebook size={13} /> Facebook Page
                    </a>
                  )}
                  {adminContact.email && (
                    <a
                      href={`mailto:${adminContact.email}`}
                      className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 rounded-full font-semibold transition"
                    >
                      <Mail size={13} /> Gmail
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Search, Filter Bar & Fleet Catalog */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800'
                    }`}
                  >
                    {cat === 'Van' ? 'Vans (8-Seater)' : cat}
                  </button>
                ))}
              </div>

              {/* Search input & Min Seats Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search 8-seater, A/C, brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={minSeats}
                  onChange={(e) => setMinSeats(e.target.value)}
                  className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Seats</option>
                  <option value="5">5+ Seats</option>
                  <option value="7">7+ Seats</option>
                  <option value="8">8+ Seats</option>
                </select>
              </div>
            </div>

            {/* Car Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  onClick={() => setSelectedCar(car)}
                  className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 transition duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Car Image Preview */}
                    <div className="relative h-52 bg-slate-950 overflow-hidden">
                      <img
                        src={car.imageUrl}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-indigo-400 border border-slate-700">
                        {car.category}
                      </div>

                      {/* 3D Pulse Badge */}
                      <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        3D View Ready
                      </div>

                      {/* Price Strip */}
                      <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-emerald-400 border border-slate-800">
                        ${car.pricePerDay}<span className="text-[10px] text-slate-400 font-normal">/day</span>
                      </div>
                    </div>

                    {/* Car Details */}
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{car.brand}</div>
                        <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition">
                          {car.name}
                        </h3>
                      </div>

                      {/* Specs Icons */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center text-xs">
                        <div className="flex flex-col items-center justify-center p-1.5 bg-slate-800/40 rounded-xl">
                          <Users size={16} className="text-indigo-400 mb-1" />
                          <span className="text-white font-bold">{car.seats} Seats</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1.5 bg-slate-800/40 rounded-xl">
                          <Wind size={16} className="text-cyan-400 mb-1" />
                          <span className="text-white font-bold">{car.airConditioned ? 'Dual A/C' : 'Standard'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1.5 bg-slate-800/40 rounded-xl">
                          <Gauge size={16} className="text-amber-400 mb-1" />
                          <span className="text-white font-bold">{car.transmission}</span>
                        </div>
                      </div>

                      {/* Highlight Badges ("8-seated", "Air Conditioner", "Comfortable") */}
                      <div className="flex flex-wrap gap-1.5">
                        {car.features && car.features.slice(0, 3).map((f, i) => (
                          <span
                            key={i}
                            className="bg-slate-800/80 text-slate-300 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700/60"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {car.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      className="w-full bg-slate-800 group-hover:bg-indigo-600 text-white font-bold text-xs py-3 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-md group-hover:shadow-indigo-600/30"
                    >
                      <Sparkles size={14} className="text-indigo-400 group-hover:text-white" />
                      <span>Inspect in 3D & Rent</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cars.length === 0 && (
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <Car size={36} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white">No cars found</h3>
                <p className="text-xs text-slate-400 mt-1">Try resetting your filters or search terms.</p>
              </div>
            )}
          </section>
        </main>
      )}

      {/* Footer with Full Admin Contacts */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Car size={20} className="text-indigo-400" />
              <span>PrimeAuto 3D Rentals</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Modern car rental management platform featuring real-time 3D vehicle inspection, transparent pricing, and instant booking reservation.
            </p>
            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} PrimeAuto 3D. All rights reserved.
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Admin & Reservation Hotline
            </h4>
            {adminContact && (
              <div className="space-y-2">
                {adminContact.phone && (
                  <a
                    href={`tel:${adminContact.phone}`}
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Phone size={14} className="text-emerald-400" />
                    <span>{adminContact.phone}</span>
                  </a>
                )}
                {adminContact.email && (
                  <a
                    href={`mailto:${adminContact.email}`}
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Mail size={14} className="text-sky-400" />
                    <span>{adminContact.email}</span>
                  </a>
                )}
                {adminContact.facebook && (
                  <a
                    href={adminContact.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Facebook size={14} className="text-blue-400" />
                    <span>Facebook Profile / Page</span>
                  </a>
                )}
                {adminContact.address && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={14} className="text-rose-400 shrink-0" />
                    <span>{adminContact.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Fleet Information
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• 8-Seater High Roof Vans (Family & Corporate)</li>
              <li>• All-Terrain AWD Explorer SUVs</li>
              <li>• Luxury Executive Sedans</li>
              <li>• Fast Velocity GT Coupes</li>
              <li>• 100% Dual Climate Air-Conditioned Fleet</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* 3D Car Detail & Reservation Modal */}
      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          adminContact={adminContact}
          user={user}
          onClose={() => setSelectedCar(null)}
          onBookSuccess={() => {
            if (token) fetchMyBookings();
          }}
        />
      )}

      {/* Customer / Admin Login & Register Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setToken(localStorage.getItem('rental_token') || '');
          if (loggedInUser.role === 'admin') {
            setCurrentView('admin');
          }
        }}
      />
    </div>
  );
}
