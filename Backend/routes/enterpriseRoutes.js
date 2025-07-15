// routes/enterpriseRoutes.js
const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterpriseController');

// Add this route
router.get('/get-enterprises', enterpriseController.searchEnterprises);

module.exports = router;