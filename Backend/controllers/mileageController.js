const prisma = require('../config/prisma');

exports.addMileage = async (req, res) => {
  try {
    const { car_id, value, recordedAt } = req.body;

    // Verify car belongs to chef_park's zone
    const car = await prisma.car.findUnique({
      where: { id: car_id },
      include: { zone: true }
    });

    if (!car || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    // Validate mileage is not less than previous mileage
    const lastMileage = await prisma.mileage.findFirst({
      where: { car_id },
      orderBy: { recordedAt: 'desc' }
    });

    if (lastMileage && value < lastMileage.value) {
      return res.status(400).json({ error: 'Mileage cannot be less than previous record' });
    }

    const mileage = await prisma.mileage.create({
      data: {
        car_id,
        value,
        recordedAt: new Date(recordedAt)
      }
    });

    res.status(201).json(mileage);
  } catch (error) {
    console.error('Error adding mileage:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate mileage record' });
    }
    
    res.status(500).json({ 
      error: 'Failed to add mileage',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};