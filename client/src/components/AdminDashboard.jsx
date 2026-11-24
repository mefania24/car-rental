import React, { useState, useEffect } from 'react';
import {
  Car,
  PlusCircle,
  Phone,
  Mail,
  ShieldCheck,
  Trash2,
  Edit3,
  CalendarCheck,
  CheckCircle,
  Clock,
  Upload,
  Layers,
  Sparkles,
  MapPin,
  Save,
  Users,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Facebook } from './Icons';
import Photo3DScanner from './Photo3DScanner';

export default function AdminDashboard({ token, onCarUpdated, onBackToSite }) {
  const [activeTab, setActiveTab] = useState('add-car'); // 'add-car' | 'cars' | 'contacts' | 'bookings'
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [contact, setContact] = useState({
    phone: '',
    facebook: '',
    email: '',
    whatsapp: '',
    address: '',
    businessHours: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // New Car Form State
  const [carName, setCarName] = useState('2026 Grand Family Tourer (8-Seater)');
  const [brand, setBrand] = useState('Toyota');
  const [category, setCategory] = useState('Van');
  const [seats, setSeats] = useState(8);
  const [transmission, setTransmission] = useState('Automatic');
  const [fuel, setFuel] = useState('Diesel');
  const [pricePerDay, setPricePerDay] = useState(85);
  const [airConditioned, setAirConditioned] = useState(true);
  const [features, setFeatures] = useState('8-seated, Air Conditioner, Comfortable, Bluetooth');
  const [description, setDescription] = useState('Spacious 8-seated van with dual-zone climate air-conditioning and superior comfort.');
  const [model3dPreset, setModel3dPreset] = useState('van');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [model3dFile, setModel3dFile] = useState(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const carsRes = await fetch('/api/cars');
      const carsData = await carsRes.json();
      setCars(carsData.cars || []);

      const contactRes = await fetch('/api/contact');
      const contactData = await contactRes.json();
      if (contactData.contact) setContact(contactData.contact);

      const bookingsRes = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.bookings) setBookings(bookingsData.bookings);
    } catch (err) {
      console.error(err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Called when AI Photo-to-3D Scanner finishes scanning an uploaded picture
  const handleScanGenerated = ({ rawFile, previewUrl, results }) => {
    setImageFile(rawFile);
    setImageUrl(previewUrl);
    if (results) {
      setModel3dPreset(results.preset || 'van');
      if (results.preset === 'van') {
        setCategory('Van');
        setSeats(8);
        setCarName('2026 Tourer Van (8-Seater)');
        setFeatures('8-seated, Air Conditioner, Comfortable, Bluetooth');
      } else if (results.preset === 'suv') {
        setCategory('SUV');
        setSeats(7);
        setCarName('2026 Explorer SUV (7-Seater)');
        setFeatures('7-seated, Air Conditioner, AWD, High Ground Clearance');
      } else if (results.preset === 'sedan') {
        setCategory('Sedan');
        setSeats(5);
        setCarName('2026 Executive Sedan (5-Seater)');
        setFeatures('5-seated, Air Conditioner, Comfortable Leather, Quiet');
      }
    }
  };

  // Handle Add New Car
  const handleAddCar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('name', carName);
    formData.append('brand', brand);
    formData.append('category', category);
    formData.append('seats', seats);
    formData.append('transmission', transmission);
    formData.append('fuel', fuel);
    formData.append('pricePerDay', pricePerDay);
    formData.append('airConditioned', airConditioned);
    formData.append('features', features);
    formData.append('description', description);
    formData.append('model3dPreset', model3dPreset);

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (imageUrl) {
      formData.append('imageUrl', imageUrl);
    }

    if (model3dFile) {
      formData.append('model3d', model3dFile);
    }

    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add car');

      setMessage('Vehicle added! 3D model successfully regenerated and published to fleet.');
      setActiveTab('cars');
      fetchData();
      if (onCarUpdated) onCarUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Car
  const handleDeleteCar = async (id) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;
    try {
      const res = await fetch(`/api/cars/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete car');
      setCars(cars.filter((c) => c.id !== id));
      if (onCarUpdated) onCarUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Save Contact Info
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(contact)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contact info');
      setMessage('Admin contact information successfully updated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Booking Status Update
  const handleUpdateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setBookings(
        bookings.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Fleet Dashboard</h1>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase">
                /admin URL
              </span>
            </div>
            <p className="text-xs text-slate-400">Isolated Admin Control • Photo 3D Reconstructor • Contacts & Fleet</p>
          </div>
        </div>

        {/* Tab Switcher & Return to Site */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('add-car')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'add-car' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Scan Photo to 3D</span>
            </button>
            <button
              onClick={() => setActiveTab('cars')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'cars' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Car Fleet ({cars.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'contacts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bookings ({bookings.length})
            </button>
          </div>

          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-700 transition"
              title="Return to public customer website"
            >
              <ArrowLeft size={14} />
              <span>View Site</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* TAB 1: ADD NEW CAR WITH AI PHOTO-TO-3D SCANNER */}
      {activeTab === 'add-car' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Step 1: Photo-to-3D Scanner Component */}
          <Photo3DScanner
            initialPreset={model3dPreset}
            onGenerated={handleScanGenerated}
          />

          {/* Step 2: Car Specs & Details Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              3. Vehicle Specifications & Pricing
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter vehicle seating ("8-seated"), air conditioner, price per day, and contact highlights.
            </p>

            <form onSubmit={handleAddCar} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Car Model / Name *</label>
                  <input
                    type="text"
                    required
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand / Make</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category & 3D Preset</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value === 'Van') { setModel3dPreset('van'); setSeats(8); }
                      else if (e.target.value === 'SUV') { setModel3dPreset('suv'); setSeats(7); }
                      else if (e.target.value === 'Sedan') { setModel3dPreset('sedan'); setSeats(5); }
                      else if (e.target.value === 'Sports') { setModel3dPreset('sports'); setSeats(2); }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-indigo-300"
                  >
                    <option value="Van">Van (8-Seater High Roof)</option>
                    <option value="SUV">SUV (All-Terrain 7-Seater)</option>
                    <option value="Sedan">Sedan (Executive 5-Seater)</option>
                    <option value="Sports">Sports Coupe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seats (Passengers)</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price Per Day ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Type</label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={airConditioned}
                      onChange={(e) => setAirConditioned(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span>Air Conditioner Included</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Features & Tags (e.g., "8-seated", "Air Conditioner", "Comfortable")
                </label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Car Description & Details</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                <span>{loading ? 'Publishing Vehicle to Fleet...' : 'Save & Publish 3D Car to Rental Fleet'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CAR FLEET LIST */}
      {activeTab === 'cars' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Rental Fleet</h2>
            <button
              onClick={() => setActiveTab('add-car')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <PlusCircle size={14} /> Add New Vehicle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div
                key={car.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img
                      src={car.imageUrl}
                      alt={car.name}
                      className="w-full h-full object-cover transition transform hover:scale-105 duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-indigo-400 border border-slate-700">
                      {car.category}
                    </div>
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-slate-700">
                      ${car.pricePerDay}/day
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white tracking-tight">{car.name}</h3>
                    
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-indigo-300">
                        {car.seats} Seats
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md">
                        {car.airConditioned ? 'Air Conditioned' : 'No A/C'}
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md">
                        {car.transmission}
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md text-emerald-300">
                        3D: {car.model3dPreset}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {car.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Status: <span className="text-emerald-400 font-semibold">Available</span>
                  </span>

                  <button
                    onClick={() => handleDeleteCar(car.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete Vehicle"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Phone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Contact Information</h2>
              <p className="text-xs text-slate-400">
                These contacts are displayed on the header, car pages, and booking confirmations for customers to reach you.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number / Hotline *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 789-2468"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Facebook Page / Profile URL</label>
              <div className="relative">
                <Facebook size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://facebook.com/your-rental-page"
                  value={contact.facebook}
                  onChange={(e) => setContact({ ...contact, facebook: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gmail / Official Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@rental.com"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Number (Optional)</label>
              <input
                type="text"
                placeholder="+15557892468"
                value={contact.whatsapp}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Office / Garage Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="104 Boulevard Way, Metro City"
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business Hours</label>
              <input
                type="text"
                placeholder="Mon - Sun: 7:00 AM - 10:00 PM"
                value={contact.businessHours}
                onChange={(e) => setContact({ ...contact, businessHours: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 mt-4"
            >
              <Save size={16} />
              <span>Save Contact Information</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: RESERVATIONS */}
      {activeTab === 'bookings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Customer Rental Reservations</h2>
            <span className="text-xs text-slate-400">Total: {bookings.length} reservations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Car</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Days / Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">
                      No customer reservations yet.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-bold text-white">{booking.carName}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{booking.customerName}</div>
                        <div className="text-[11px] text-slate-400">{booking.customerPhone}</div>
                        {booking.customerEmail && (
                          <div className="text-[10px] text-slate-500">{booking.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>{booking.startDate} to</div>
                        <div className="text-slate-400">{booking.endDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-400">${booking.totalPrice}</div>
                        <div className="text-[10px] text-slate-400">{booking.totalDays} day(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            booking.status === 'Confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : booking.status === 'Completed'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : booking.status === 'Cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
