// controllers/userController.js
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true,
        email: true,
        phone_number:true,
        first_name: true,
        last_name: true,
        photo: true,
        role: true,
        enterprise: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { first_name, last_name },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        photo: true,
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Upload profile photo
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // 1. Get the file extension
    const ext = path.extname(req.file.originalname);
    
    // 2. Create a simple filename
    const filename = `${Date.now()}${ext}`;
    
    // 3. Define the URL path (not filesystem path)
    const photoUrl = `/uploads/profile-photos/${filename}`;
    
    // 4. Update database FIRST
    await prisma.user.update({
      where: { id: req.user.id },
      data: { photo: photoUrl }
    });

    // 5. Then move the file (if DB update succeeds)
    const targetPath = path.join(__dirname, '../public/uploads/profile-photos', filename);
    await fs.promises.rename(req.file.path, targetPath);

    res.json({ photoUrl });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};