//Controllers/particulierController.js
const prisma = require('../config/prisma');

// Get all cars for a particulier
exports.getCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
};

// Create or update a car
exports.saveCar = async (req, res) => {
  try {
    const { make, model, year, licensePlate, vin_number, initial_mileage } = req.body;
    
    const data = {
      make,
      model,
      year: parseInt(year),
      licensePlate,
      vin_number,
      initial_mileage: parseFloat(initial_mileage),
      user_id: req.user.id
    };

    let car;
    if (req.params.id) {
      car = await prisma.car.update({
        where: { id: req.params.id },
        data
      });
    } else {
      car = await prisma.car.create({ data });
    }

    res.json(car);
  } catch (error) {
    console.error('Error saving car:', error);
    res.status(500).json({ error: 'Failed to save car' });
  }
};

// Check if car has maintenance records before deletion
exports.checkCarForMaintenance = async (req, res) => {
  try {
    const maintenanceCount = await prisma.maintenance.count({
      where: {
        car_id: req.params.id
      }
    });

    res.json({ hasMaintenance: maintenanceCount > 0 });
  } catch (error) {
    console.error('Error checking car maintenance:', error);
    res.status(500).json({ error: 'Failed to check maintenance records' });
  }
};

// Delete a car
exports.deleteCar = async (req, res) => {
  try {
    const maintenanceCount = await prisma.maintenance.count({
      where: {
        car_id: req.params.id
      }
    });

    if (maintenanceCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete car with existing maintenance records' 
      });
    }
    
    await prisma.car.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
};

// Get all maintenance records for a particulier
exports.getMaintenances = async (req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      where: {
        car: {
          user_id: req.user.id
        }
      },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            licensePlate: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(maintenances);
  } catch (error) {
    console.error('Error fetching maintenances:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
};

// Create or update a maintenance record
exports.saveMaintenance = async (req, res) => {
  try {
    const { car_id, type, date, recordedMileage, cost, description, status } = req.body;
    
    const data = {
      car_id,
      type,
      date: new Date(date),
      recordedMileage: parseInt(recordedMileage),
      cost: parseFloat(cost),
      description,
      status
    };

    let maintenance;
    if (req.params.id) {
      maintenance = await prisma.maintenance.update({
        where: { id: req.params.id },
        data
      });
    } else {
      maintenance = await prisma.maintenance.create({ data });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Error saving maintenance:', error);
    res.status(500).json({ error: 'Failed to save maintenance record' });
  }
};

// Delete a maintenance record
exports.deleteMaintenance = async (req, res) => {
  try {
    await prisma.maintenance.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance:', error);
    res.status(500).json({ error: 'Failed to delete maintenance record' });
  }
};