import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed state
const getInitialData = () => {
  const adminSalt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', adminSalt);
  
  const userSalt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('customer123', userSalt);

  return {
    users: [
      {
        id: 'admin-01',
        name: 'System Admin',
        email: 'admin@rental.com',
        password: adminPasswordHash,
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cust-01',
        name: 'John Doe',
        email: 'customer@rental.com',
        password: userPasswordHash,
        role: 'customer',
        createdAt: new Date().toISOString()
      }
    ],
    adminContact: {
      phone: '+1 (555) 789-2468',
      facebook: 'https://facebook.com/PrimeAutoRentals',
      email: 'admin@rental.com',
      whatsapp: '+15557892468',
      address: '104 Boulevard Way, Metro City',
      businessHours: 'Mon - Sun: 7:00 AM - 10:00 PM'
    },
    cars: [
      {
        id: 'car-01',
        name: 'Grand Family Tourer Van',
        brand: 'Toyota',
        category: 'Van',
        seats: 8,
        transmission: 'Automatic',
        fuel: 'Diesel',
        pricePerDay: 85,
        airConditioned: true,
        features: [
          '8-seated',
          'Air Conditioner (Dual Zone)',
          'Comfortable Captain Seats',
          'Extra Luggage Space',
          'Touchscreen GPS'
        ],
        description: 'Perfect for large family trips and corporate travel. Smooth suspension, 8 comfortable seats with ample legroom and luggage space.',
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        model3dPreset: 'van',
        model3dType: 'preset',
        model3dUrl: '/models/van.glb',
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'car-02',
        name: 'Apex All-Terrain Explorer SUV',
        brand: 'Ford',
        category: 'SUV',
        seats: 7,
        transmission: 'Automatic',
        fuel: 'Gasoline',
        pricePerDay: 95,
        airConditioned: true,
        features: [
          '7-seated',
          'Full Climate Control',
          'All-Wheel Drive (AWD)',
          'High Ground Clearance',
          'Apple CarPlay & Android Auto'
        ],
        description: 'Tackle any highway or country road with this luxurious, spacious SUV. Features powerful engine performance and premium interior comfort.',
        imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
        model3dPreset: 'suv',
        model3dType: 'preset',
        model3dUrl: '/models/suv.glb',
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'car-03',
        name: 'Executive Elegance Sedan',
        brand: 'Mercedes-Benz',
        category: 'Sedan',
        seats: 5,
        transmission: 'Automatic',
        fuel: 'Hybrid',
        pricePerDay: 110,
        airConditioned: true,
        features: [
          '5-seated',
          'Whisper-Quiet A/C',
          'Leather Ergonomic Seats',
          'Fuel Efficient Hybrid',
          'Premium Sound System'
        ],
        description: 'Arrive in style. Modern, sleek, and exceptionally comfortable for business meetings, airport transfers, and couple weekend escapes.',
        imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
        model3dPreset: 'sedan',
        model3dType: 'preset',
        model3dUrl: '/models/sedan.glb',
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'car-04',
        name: 'Velocity GT Sport Coupe',
        brand: 'Porsche',
        category: 'Sports',
        seats: 2,
        transmission: 'Automatic',
        fuel: 'Gasoline',
        pricePerDay: 160,
        airConditioned: true,
        features: [
          '2-seated',
          'Dual Climate A/C',
          'Sport Exhaust System',
          'Panoramic Sunroof',
          '0-60 in 3.6s'
        ],
        description: 'For thrill-seekers who crave unmatched performance, precision handling, and jaw-dropping road presence.',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        model3dPreset: 'sports',
        model3dType: 'preset',
        model3dUrl: '/models/sports.glb',
        available: true,
        createdAt: new Date().toISOString()
      }
    ],
    bookings: [
      {
        id: 'book-01',
        carId: 'car-01',
        carName: 'Grand Family Tourer Van',
        userId: 'cust-01',
        customerName: 'John Doe',
        customerEmail: 'customer@rental.com',
        customerPhone: '+1 (555) 321-9876',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        totalDays: 4,
        totalPrice: 340,
        status: 'Confirmed',
        notes: 'Needs child car seat installed.',
        createdAt: new Date().toISOString()
      }
    ]
  };
};

// Read database
export const readDb = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading db.json, reinitializing...', error);
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
};

// Write database atomically
export const writeDb = (data) => {
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
  return data;
};
