import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import { seedInitialData } from './seed.js';

import authRoutes from './routes/auth.js';
import ratesRoutes from './routes/rates.js';
import shipmentsRoutes from './routes/shipments.js';
import invoicesRoutes from './routes/invoices.js';
import emailsRoutes from './routes/emails.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Ocean Freight Rate & Shipment Tracker API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve client in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('API Server is running on port ' + PORT);
    }
  });
});

async function startServer() {
  try {
    await initDatabase();
    await seedInitialData(false);

    app.listen(PORT, () => {
      console.log(`🚀 Ocean Freight Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
