
const prisma = require('../config/prisma');

//CHEF_PARK RELATED
exports.getCarsInMyZones = async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { chef_park_id: req.user.id },
      select: { id: true }
    });

    const cars = await prisma.car.findMany({
      where: { 
        zone_id: { in: zones.map(z => z.id) },
        zone: { chef_park_id: req.user.id } // Extra security check
      },
      include: {
        zone: { select: { zone_name: true } },
        mileages: { orderBy: { recordedAt: 'desc' }, take: 1 }
      }
    });

    res.json(cars || []); // Always return array
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: 'Failed to fetch cars',
      details: error.message 
    });
  }
};

exports.getCarsByZoneId = async (req, res) => {
  try {
    const { zoneId } = req.params;

    // 1. Validate zoneId exists
    if (!zoneId) {
      return res.status(400).json({ error: 'Zone ID is required' });
    }

    // 2. Verify requesting user has access to this zone
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      select: { chef_park_id: true }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    if (zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to zone' });
    }

    // 3. Fetch cars with their latest mileage
    const cars = await prisma.car.findMany({
      where: { zone_id: zoneId },
      include: {
        mileages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get only the most recent mileage
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Format the response
    const formattedCars = cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      //initial_mileage: car.initial_mileage,
      licensePlate: car.licensePlate,
      vin_number: car.vin_number,
      mileages: car.mileages
    }));

    res.status(200).json(formattedCars);

  } catch (error) {
    console.error('Error fetching cars by zone:', error);
    
    // Handle Prisma errors specifically
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch cars',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};


exports.getCarById = async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: {
        zone: {
          select: {
            id: true,
            zone_name: true,
            chef_park_id: true
          }
        },
        mileages: {
          orderBy: { recordedAt: 'desc' },
        },
        maintenances: {
          orderBy: { date: 'desc' },
        }
      }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Verify the car belongs to a zone managed by this chef_park
    if (!car.zone || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    res.json(car);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch car details' });
  }
};

exports.addCarInZone = async (req, res) => {
  try {
    const { make, model, year, licensePlate, vin_number, initial_mileage, zone_id } = req.body;

    // Verify zone belongs to chef_park
    const zone = await prisma.zone.findUnique({
      where: { id: zone_id },
      select: { chef_park_id: true }
    });

    if (!zone || zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized zone access' });
    }

    const car = await prisma.car.create({
      data: {
        make,
        model,
        year,
        licensePlate,
        vin_number,
        initial_mileage,
        zone_id,
        user_id: req.user.id,
      }
    });

    await prisma.mileage.create({
    data: {
      value: initial_mileage,
      car_id: car.id,
    },
  });

    res.status(201).json(car); // Return the car object
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    res.status(500).json({ 
    error: 'Failed to create car',
    details: error.message // Include error details in response
    });
  }
};

exports.transferCar = async (req, res) => {
  try {
    const { zone_id } = req.body;

    // Verify both source and destination zones belong to chef_park
    const [car, newZone] = await Promise.all([
      prisma.car.findUnique({
        where: { id: req.params.id },
        include: { zone: true }
      }),
      prisma.zone.findUnique({
        where: { id: zone_id },
        select: { chef_park_id: true }
      })
    ]);

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (!newZone || newZone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized zone access' });
    }

    const updatedCar = await prisma.car.update({
      where: { id: req.params.id },
      data: { zone_id }
    });

    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer car' });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const { make, model, year, licensePlate, vin_number } = req.body;

    // First verify car exists in chef_park's zone
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: { zone: true }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (!car.zone || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    const updatedCar = await prisma.car.update({
      where: { id: req.params.id },
      data: { make, model, year, licensePlate, vin_number },
      include: { zone: true }
    });

    res.json(updatedCar);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    res.status(500).json({ error: 'Failed to update car' });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: { 
        zone: { select: { chef_park_id: true } },
        mileages: { take: 1 },
        maintenances: { take: 1 }
      }
    });

    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (!car.zone || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    // Check for existing records
    if (car.mileages.length > 0 || car.maintenances.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete car with existing records',
        details: {
          hasMileages: car.mileages.length > 0,
          hasMaintenances: car.maintenances.length > 0
        }
      });
    }

    await prisma.car.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete car' });
  }
};
