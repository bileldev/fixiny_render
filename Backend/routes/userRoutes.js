// routes/users.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadHandler')
const { authenticate } = require('../middleware/authHandler');
const { getProfile, updateProfile,uploadPhoto } = require('../controllers/userController');
const {getUserNotifications, markAllAsRead, markAsRead} = require('../controllers/notificationsController')

// User profile routes
router.get('/get-profile', authenticate, getProfile);
router.put('/update-profile', authenticate, updateProfile);
router.post('/update-profile/photo', authenticate, upload, uploadPhoto);

// Get all notifications for current user
router.get('/notifications', authenticate, getUserNotifications);

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.patch('/notifications/read-all', authenticate, markAllAsRead);

module.exports = router;