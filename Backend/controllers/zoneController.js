const prisma = require('../config/prisma');
const logger = require('../utils/logger');

exports.getMyZones = async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { chef_park_id: req.user.id },
      include: {
        cars: {
          select: { id: true, licensePlate: true }
        },
        budget: true
      }
    });
    res.json(zones);
  } catch (error) {
    logger.error('Failed to fetch zones:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
};

exports.getZoneById = async (req, res) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: req.params.id },
      include: {
        cars: {
          include: {
            mileages: {
              orderBy: { recordedAt: 'desc' },
              take: 1
            }
          }
        },
        budget: true,
        enterprise: {
          select: {
            id: true,
            name: true
          }
        },
        chef_park: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Verify the zone belongs to this chef_park
    if (zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized zone access' });
    }

    // Format the response to include useful car information
    const response = {
      ...zone,
      cars: zone.cars.map(car => ({
        ...car,
        currentMileage: car.mileages[0]?.value || 0
      }))
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch zone details:', error);
    res.status(500).json({ error: 'Failed to fetch zone details' });
  }
};

exports.addZone = async (req, res) => {
  try {
    const { zone_name, description } = req.body;
    
    // Verify user has enterprise_id
    if (!req.user.enterprise_id) {
      return res.status(403).json({ error: 'User not associated with any enterprise' });
    }    

    const newZone = await prisma.zone.create({
      data: {
        zone_name,
        description: description || '', // Handle empty description
        enterprise_id: req.user.enterprise_id,
        chef_park_id: req.user.id
      }
    });
    
    res.status(201).json(newZone);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Zone name already exists in this enterprise' 
      });
    }
    logger.error('Failed to add zone:', error);
    res.status(500).json({ error: 'Failed to add zone' });
  }
};

exports.deleteZone = async (req, res) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: req.params.id },
      include: { cars: true }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    if (zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized zone access' });
    }

    if (zone.cars.length > 0) {
      return res.status(400).json({ 
        error: 'Zone contains cars and cannot be deleted' 
      });
    }

    await prisma.zone.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete zone:', error);
    res.status(500).json({ error: 'Failed to delete zone' });
  }
};