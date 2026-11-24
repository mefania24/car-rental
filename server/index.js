import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'car-rental-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Set up upload directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max for 3D glb models & photos
});

// Auth helper middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  });
};

// ----------------- ROUTES ----------------- //

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = readDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = {
      id: 'user-' + Date.now(),
      name,
      email,
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Cars: List all with filtering
app.get('/api/cars', (req, res) => {
  try {
    const db = readDb();
    let cars = [...db.cars];
    const { category, search, minSeats } = req.query;

    if (category && category !== 'All') {
      cars = cars.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    if (minSeats) {
      cars = cars.filter(c => Number(c.seats) >= Number(minSeats));
    }
    if (search) {
      const q = search.toLowerCase();
      cars = cars.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.features.some(f => f.toLowerCase().includes(q))
      );
    }

    res.json({ cars });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cars: Get single car
app.get('/api/cars/:id', (req, res) => {
  const db = readDb();
  const car = db.cars.find(c => c.id === req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json({ car });
});

// Cars: Add new car (Admin only)
app.post(
  '/api/cars',
  requireAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model3d', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const db = readDb();
      const {
        name,
        brand,
        category,
        seats,
        transmission,
        fuel,
        pricePerDay,
        airConditioned,
        features,
        description,
        model3dPreset,
        imageUrl: customImageUrl
      } = req.body;

      if (!name || !pricePerDay) {
        return res.status(400).json({ error: 'Car name and daily price are required' });
      }

      let imageUrl = customImageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
      if (req.files && req.files['image'] && req.files['image'][0]) {
        imageUrl = `/uploads/${req.files['image'][0].filename}`;
      }

      let model3dUrl = '';
      let model3dType = 'preset';
      if (req.files && req.files['model3d'] && req.files['model3d'][0]) {
        model3dUrl = `/uploads/${req.files['model3d'][0].filename}`;
        model3dType = 'custom';
      }

      // Parse features if string
      let parsedFeatures = [];
      if (typeof features === 'string') {
        try {
          parsedFeatures = JSON.parse(features);
        } catch {
          parsedFeatures = features.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(features)) {
        parsedFeatures = features;
      }

      const newCar = {
        id: 'car-' + Date.now(),
        name,
        brand: brand || 'Vehicle',
        category: category || 'Van',
        seats: Number(seats) || 8,
        transmission: transmission || 'Automatic',
        fuel: fuel || 'Gasoline',
        pricePerDay: Number(pricePerDay),
        airConditioned: airConditioned === 'true' || airConditioned === true,
        features: parsedFeatures.length > 0 ? parsedFeatures : [`${seats || 8}-seated`, 'Air Conditioner', 'Comfortable'],
        description: description || 'Spacious, reliable, and comfortable rental vehicle.',
        imageUrl,
        model3dType,
        model3dPreset: model3dPreset || 'van',
        model3dUrl,
        available: true,
        createdAt: new Date().toISOString()
      };

      db.cars.unshift(newCar);
      writeDb(db);

      res.status(201).json({ message: 'Car added successfully', car: newCar });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Cars: Update car (Admin only)
app.put(
  '/api/cars/:id',
  requireAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model3d', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const db = readDb();
      const index = db.cars.findIndex(c => c.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Car not found' });

      const existingCar = db.cars[index];
      const {
        name,
        brand,
        category,
        seats,
        transmission,
        fuel,
        pricePerDay,
        airConditioned,
        features,
        description,
        model3dPreset,
        available,
        imageUrl: customImageUrl
      } = req.body;

      let imageUrl = existingCar.imageUrl;
      if (req.files && req.files['image'] && req.files['image'][0]) {
        imageUrl = `/uploads/${req.files['image'][0].filename}`;
      } else if (customImageUrl) {
        imageUrl = customImageUrl;
      }

      let model3dUrl = existingCar.model3dUrl;
      let model3dType = existingCar.model3dType;
      if (req.files && req.files['model3d'] && req.files['model3d'][0]) {
        model3dUrl = `/uploads/${req.files['model3d'][0].filename}`;
        model3dType = 'custom';
      }

      let parsedFeatures = existingCar.features;
      if (typeof features === 'string') {
        try {
          parsedFeatures = JSON.parse(features);
        } catch {
          parsedFeatures = features.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(features)) {
        parsedFeatures = features;
      }

      const updatedCar = {
        ...existingCar,
        name: name !== undefined ? name : existingCar.name,
        brand: brand !== undefined ? brand : existingCar.brand,
        category: category !== undefined ? category : existingCar.category,
        seats: seats !== undefined ? Number(seats) : existingCar.seats,
        transmission: transmission !== undefined ? transmission : existingCar.transmission,
        fuel: fuel !== undefined ? fuel : existingCar.fuel,
        pricePerDay: pricePerDay !== undefined ? Number(pricePerDay) : existingCar.pricePerDay,
        airConditioned: airConditioned !== undefined ? (airConditioned === 'true' || airConditioned === true) : existingCar.airConditioned,
        features: parsedFeatures,
        description: description !== undefined ? description : existingCar.description,
        imageUrl,
        model3dType,
        model3dPreset: model3dPreset || existingCar.model3dPreset,
        model3dUrl,
        available: available !== undefined ? (available === 'true' || available === true) : existingCar.available,
        updatedAt: new Date().toISOString()
      };

      db.cars[index] = updatedCar;
      writeDb(db);

      res.json({ message: 'Car updated successfully', car: updatedCar });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Cars: Delete car (Admin only)
app.delete('/api/cars/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const index = db.cars.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Car not found' });

  db.cars.splice(index, 1);
  writeDb(db);
  res.json({ message: 'Car deleted successfully' });
});

// Admin Contact: Get details (Public)
app.get('/api/contact', (req, res) => {
  const db = readDb();
  res.json({ contact: db.adminContact });
});

// Admin Contact: Update details (Admin only)
app.put('/api/contact', requireAdmin, (req, res) => {
  try {
    const db = readDb();
    const { phone, facebook, email, whatsapp, address, businessHours } = req.body;

    db.adminContact = {
      ...db.adminContact,
      phone: phone || db.adminContact.phone,
      facebook: facebook || db.adminContact.facebook,
      email: email || db.adminContact.email,
      whatsapp: whatsapp || db.adminContact.whatsapp,
      address: address || db.adminContact.address,
      businessHours: businessHours || db.adminContact.businessHours
    };

    writeDb(db);
    res.json({ message: 'Contact information updated', contact: db.adminContact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookings: Create reservation (Customer or Guest)
app.post('/api/bookings', (req, res) => {
  try {
    const db = readDb();
    const {
      carId,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      totalDays,
      notes,
      userId
    } = req.body;

    if (!carId || !customerName || !customerPhone || !startDate || !endDate) {
      return res.status(400).json({ error: 'Required booking details missing' });
    }

    const car = db.cars.find(c => c.id === carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const days = Number(totalDays) || 1;
    const totalPrice = days * car.pricePerDay;

    const newBooking = {
      id: 'book-' + Date.now(),
      carId: car.id,
      carName: car.name,
      userId: userId || null,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      startDate,
      endDate,
      totalDays: days,
      totalPrice,
      status: 'Pending',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    db.bookings.unshift(newBooking);
    writeDb(db);

    res.status(201).json({ message: 'Booking requested successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookings: List bookings (Admin gets all, Customer gets own)
app.get('/api/bookings', authenticateToken, (req, res) => {
  const db = readDb();
  if (req.user.role === 'admin') {
    return res.json({ bookings: db.bookings });
  }
  // Customer can see their bookings
  const userBookings = db.bookings.filter(b => b.userId === req.user.id || b.customerEmail === req.user.email);
  res.json({ bookings: userBookings });
});

// Bookings: Update status (Admin only)
app.patch('/api/bookings/:id/status', requireAdmin, (req, res) => {
  const db = readDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { status } = req.body;
  if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  booking.status = status;
  writeDb(db);
  res.json({ message: 'Booking status updated', booking });
});

// Serve frontend in production (Render)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
