const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const {authenticate} = require('../middleware/authHandler')

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Add this to your existing auth routes
router.get('/verify', authenticate, (req, res) => {
    try {
        res.json({
            id: req.user.id,
            email: req.user.email,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            role: req.user.role,
            status: req.user.status
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to verify session' });
      }    
  });

module.exports = router;