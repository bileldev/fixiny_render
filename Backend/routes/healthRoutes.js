const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');


// Simple health check
router.get('/health', async (req, res) => {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memoryUsage: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      database: error instanceof Error ? 'disconnected' : 'unknown error',
    });
  }
});

module.exports = router;