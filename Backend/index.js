// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chefParkRoutes = require('./routes/chefParkRoutes');
const particulierRoutes = require('./routes/particulierRoutes')
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const { authenticate } = require('./middleware/authHandler');
const InitService = require('./services/initService');
const logger = require('./utils/logger');
const { checkMaintenanceNotifications } = require('./services/maintenanceNotifier');
const healthRouter = require('./routes/healthRoutes');



const PORT = process.env.PORT || 3001;
const app = express();

// Enable CORS for all routes (or customize as needed)
app.use(cors({
  origin: 'https://fixiny-vercel.vercel.app', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
  credentials: true // Enable cookies/auth headers if needed
}));

app.use(cors({
  origin: ['http://localhost:8081', 'exp://192.168.1.33:8081'], // Add your mobile URLs
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/factures', express.static(path.join(__dirname, 'uploads/factures')));

// Your existing routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chef-park', chefParkRoutes);
app.use('/api/particulier', particulierRoutes)
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api', healthRouter);


// Protected route example (admin-only)
app.get('/', authenticate, (req, res) => {
  res.json({ message: "Admin access granted!" });
});

async function startServer() {
  logger.info('🚀 Starting server initialization...');
  try {

    // Initialize database with required data
    logger.info('🔧 Running database initialization...');
    await InitService.initializeApplication();
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`🟢 Server running on port ${PORT}`);
      logger.info(`👉 Access the server at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('🔴 Critical startup error:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

async function startCronJobs () {
  console.log('⏰ Initializing cron jobs...');
  checkMaintenanceNotifications(); // This should run the cron.schedule()
};

startServer();

startCronJobs();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

