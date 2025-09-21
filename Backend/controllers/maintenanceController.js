const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

exports.getMaintenances = async (req, res) => {
  try {
    // Get all cars in zones managed by this chef_park
    const zones = await prisma.zone.findMany({
      where: { chef_park_id: req.user.id },
      select: { id: true }
    });

    const maintenances = await prisma.maintenance.findMany({
      where: {
        car: {
          zone_id: { in: zones.map(z => z.id) }
        }
      },
      include: {
        car: {
          select: {
            licensePlate: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenances' });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const { car_id, type, date, recordedMileage, cost, description } = req.body;

    // Handle file upload
    let factureUrl = null;
    if (req.file) {
      try {
        const uploadDir = path.join(__dirname, '../uploads/factures');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileExt = path.extname(req.file.originalname);
        const fileName = `facture_${Date.now()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.promises.rename(req.file.path, filePath);
        factureUrl = `${process.env.BACKEND_URL}/factures/${fileName}`;
      } catch (fileError) {
        console.error('File upload error:', fileError);
        return res.status(500).json({ error: 'Failed to process invoice file' });
      }
    }

    // Verify car belongs to chef_park's zone
    const car = await prisma.car.findUnique({
      where: { id: car_id },
      include: { zone: true }
    });

    if (!car || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    // Convert values with proper error handling
    const mileageValue = parseInt(recordedMileage);
    if (isNaN(mileageValue)) {
      return res.status(400).json({ error: 'Invalid mileage value' });
    }

    const costValue = parseFloat(cost);
    if (isNaN(costValue)) {
      return res.status(400).json({ error: 'Invalid cost value' });
    }

    const maintenance = await prisma.$transaction([
      prisma.maintenance.create({
        data: {
          car_id,
          type,
          date: new Date(date),
          recordedMileage:  mileageValue,
          cost: costValue,
          description,
          factureUrl,
          status: type === 'PREVENTIVE_MAINTENANCE' ? 'UPCOMING' : 'DONE'
        }
      }),
      prisma.mileage.create({
        data: {
          value: mileageValue,
          recordedAt: new Date(date),
          car_id
        }
      })
    ]);

    res.status(201).json(maintenance[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create maintenance' });
  }
};

exports.getMaintenanceHistory = async (req, res) => {
  try {
    // Verify car belongs to chef_park's zone
    const car = await prisma.car.findUnique({
      where: { id: req.params.carId },
      include: { 
        zone: {
          select: { chef_park_id: true }
        }
      }
    });

    if (!car || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    const history = await prisma.maintenance.findMany({
      where: { car_id: req.params.carId },
      orderBy: { date: 'desc' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance history' });
  }
};
/*Aymen solution*/
exports.planMaintenance = async (req, res) => {
  try {
    const { car_id } = req.body;
    const MILEAGE_BUFFER = 1000; // Window to plan ahead (km)
    const DAYS_AHEAD_FOR_UPCOMING = 7; // Days to schedule upcoming maintenance

    // Get car with latest data
    const car = await prisma.car.findUnique({
      where: { id: car_id },
      include: { 
        zone: true,
        mileages: { orderBy: { recordedAt: 'desc' }, take: 1 },
        maintenances: {
          where: { 
            OR: [
              { status: { in: ['UPCOMING', 'OVERDUE'] } },
              { type: 'PREVENTIVE_MAINTENANCE' }
            ]
          },
          orderBy: { recordedMileage: 'desc' }
        }
      }
    });

    if (!car || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    const maintenanceRules = await prisma.maintenanceRule.findMany();
    const currentMileage = car.mileages[0]?.value || car.initial_mileage;
    const plannedMaintenances = [];

    // Find all preventive maintenances ever done on this car
    const allPreventiveMaintenances = await prisma.maintenance.findMany({
      where: {
        car_id,
        type: 'PREVENTIVE_MAINTENANCE',
        status: 'DONE'
      },
      orderBy: { recordedMileage: 'desc' }
    });

    for (const rule of maintenanceRules) {
      // Find last completed instance of this specific maintenance
      const lastDone = allPreventiveMaintenances.find(m => m.description === rule.name);
      const lastDoneMileage = lastDone?.recordedMileage || car.initial_mileage;

      // Calculate first due mileage after last done
      let nextDueMileage = lastDoneMileage + rule.mileageInterval;
      
      // Plan all instances up to current mileage + buffer
      while (nextDueMileage <= currentMileage + MILEAGE_BUFFER) {
        // Check if this exact maintenance point already exists
        const existing = car.maintenances.find(m => 
          m.description === rule.name && 
          m.recordedMileage === nextDueMileage
        );

        if (!existing) {
          const isOverdue = nextDueMileage <= currentMileage;
          const plannedDate = new Date();
          plannedDate.setDate(plannedDate.getDate() + 
            (isOverdue ? 0 : DAYS_AHEAD_FOR_UPCOMING));

          const newMaintenance = await prisma.maintenance.create({
            data: {
              car_id,
              type: 'PREVENTIVE_MAINTENANCE',
              date: plannedDate,
              recordedMileage: nextDueMileage,
              cost: 0,
              description: rule.name,
              status: isOverdue ? 'OVERDUE' : 'UPCOMING'
            }
          });
          plannedMaintenances.push(newMaintenance);
        }

        // Move to next interval
        nextDueMileage += rule.mileageInterval;
      }
    }

    res.status(200).json(plannedMaintenances);
  } catch (error) {
    console.error('Error planning maintenance:', error);
    res.status(500).json({ 
      error: 'Failed to plan maintenance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/*
exports.planMaintenance = async (req, res) => {
  try {
    const { car_id } = req.body;
    const MILEAGE_WINDOW = 1000; // Show maintenance as upcoming if within 1000 km

    // Get car with latest data
    const car = await prisma.car.findUnique({
      where: { id: car_id },
      include: { 
        zone: true,
        mileages: { orderBy: { recordedAt: 'desc' }, take: 1 },
        maintenances: {
          where: { 
            OR: [
              { status: { in: ['UPCOMING', 'OVERDUE'] } },
              { type: 'PREVENTIVE_MAINTENANCE' }
            ]
          },
          orderBy: { recordedMileage: 'desc' }
        }
      }
    });

    if (!car || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    const maintenanceRules = await prisma.maintenanceRule.findMany();
    const currentMileage = car.mileages[0]?.value || car.initial_mileage;
    const plannedMaintenances = [];

    // Find all preventive maintenances ever done on this car
    const allPreventiveMaintenances = await prisma.maintenance.findMany({
      where: {
        car_id,
        type: 'PREVENTIVE_MAINTENANCE',
        status: 'DONE'
      },
      orderBy: { recordedMileage: 'desc' }
    });

    for (const rule of maintenanceRules) {
      // Find last completed instance of this specific maintenance
      const lastDone = allPreventiveMaintenances.find(m => m.description === rule.name);
      const lastDoneMileage = lastDone?.recordedMileage || car.initial_mileage;

      // Calculate next due mileage
      const nextDueMileage = lastDoneMileage + rule.mileageInterval;
      
      // Calculate mileage difference
      const mileageDifference = nextDueMileage - currentMileage;
      
      // Determine status based on mileage difference
      let status = 'PLANNED';
      if (mileageDifference <= 0) {
        status = 'OVERDUE';
      } else if (mileageDifference <= MILEAGE_WINDOW) {
        status = 'UPCOMING';
      }

      // Check if this exact maintenance point already exists
      const existing = car.maintenances.find(m => 
        m.description === rule.name && 
        m.recordedMileage === nextDueMileage
      );

      if (!existing) {
        // Only create if it's overdue or upcoming
        if (status === 'OVERDUE' || status === 'UPCOMING') {
          const plannedDate = new Date();
          // Set date based on status
          if (status === 'OVERDUE') {
            plannedDate.setDate(plannedDate.getDate() - 7); // Overdue by a week
          } else {
            // Estimate date based on average daily mileage
            // This is a simple estimation - you might want to improve this
            const estimatedDays = Math.ceil(mileageDifference / 100); // Assuming 100 km per day
            plannedDate.setDate(plannedDate.getDate() + estimatedDays);
          }

          const newMaintenance = await prisma.maintenance.create({
            data: {
              car_id,
              type: 'PREVENTIVE_MAINTENANCE',
              date: plannedDate,
              recordedMileage: nextDueMileage,
              cost: 0,
              description: rule.name,
              status: status
            }
          });
          plannedMaintenances.push(newMaintenance);
        }
      } else if (existing.status !== status) {
        // Update status if it has changed
        await prisma.maintenance.update({
          where: { id: existing.id },
          data: { status }
        });
        plannedMaintenances.push({ ...existing, status });
      } else {
        plannedMaintenances.push(existing);
      }
    }

    res.status(200).json(plannedMaintenances);
  } catch (error) {
    console.error('Error planning maintenance:', error);
    res.status(500).json({ 
      error: 'Failed to plan maintenance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
*/

// In maintenanceController.js - update the planMaintenance function
/*exports.planMaintenance = async (req, res) => {
  try {
    const { car_id } = req.body;
    const MILEAGE_WINDOW = 1000; // Show maintenance as upcoming if within 1000 km

    // Get car with latest data
    const car = await prisma.car.findUnique({
      where: { id: car_id },
      include: { 
        zone: true,
        mileages: { orderBy: { recordedAt: 'desc' }, take: 1 },
        maintenances: {
          where: { 
            OR: [
              { status: { in: ['UPCOMING', 'OVERDUE'] } },
              { type: 'PREVENTIVE_MAINTENANCE' }
            ]
          },
          orderBy: { recordedMileage: 'desc' }
        }
      }
    });

    if (!car || car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized car access' });
    }

    const maintenanceRules = await prisma.maintenanceRule.findMany();
    const currentMileage = car.mileages[0]?.value || car.initial_mileage;
    const plannedMaintenances = [];

    // Find all preventive maintenances ever done on this car
    const allPreventiveMaintenances = await prisma.maintenance.findMany({
      where: {
        car_id,
        type: 'PREVENTIVE_MAINTENANCE',
        status: 'DONE'
      },
      orderBy: { recordedMileage: 'desc' }
    });

    for (const rule of maintenanceRules) {
      // Find last completed instance of this specific maintenance
      const lastDone = allPreventiveMaintenances.find(m => m.description === rule.name);
      const lastDoneMileage = lastDone?.recordedMileage || car.initial_mileage;

      // Calculate next due mileage
      const nextDueMileage = lastDoneMileage + rule.mileageInterval;
      
      // Calculate mileage difference
      const mileageDifference = nextDueMileage - currentMileage;
      
      // Determine status based on mileage difference
      let status = 'PLANNED';
      if (mileageDifference <= 0) {
        status = 'OVERDUE';
      } else if (mileageDifference <= MILEAGE_WINDOW) {
        status = 'UPCOMING';
      }

      // Check if this exact maintenance point already exists
      const existing = car.maintenances.find(m => 
        m.description === rule.name && 
        m.recordedMileage === nextDueMileage
      );

      if (!existing) {
        // Only create if it's overdue or upcoming
        if (status === 'OVERDUE' || status === 'UPCOMING') {
          const plannedDate = new Date();
          // Set date based on status
          if (status === 'OVERDUE') {
            plannedDate.setDate(plannedDate.getDate() - 7); // Overdue by a week
          } else {
            // Estimate date based on average daily mileage
            const estimatedDays = Math.ceil(mileageDifference / 100); // Assuming 100 km per day
            plannedDate.setDate(plannedDate.getDate() + estimatedDays);
          }

          const newMaintenance = await prisma.maintenance.create({
            data: {
              car_id,
              type: 'PREVENTIVE_MAINTENANCE',
              date: plannedDate,
              recordedMileage: nextDueMileage,
              cost: 0,
              description: rule.name,
              status: status
            }
          });
          plannedMaintenances.push(newMaintenance);
        }
      } else if (existing.status !== status) {
        // Update status if it has changed
        await prisma.maintenance.update({
          where: { id: existing.id },
          data: { status }
        });
        plannedMaintenances.push({ ...existing, status });
      } else {
        plannedMaintenances.push(existing);
      }
    }

    res.status(200).json(plannedMaintenances);
  } catch (error) {
    console.error('Error planning maintenance:', error);
    res.status(500).json({ 
      error: 'Failed to plan maintenance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};*/

exports.getUpcomingMaintenances = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: {
        zone: {
          chef_park_id: req.user.id
        }
      },
      include: {
        maintenances: {
          where: {
            status: { in: ['UPCOMING', 'OVERDUE'] }
          },
          orderBy: { date: 'asc' }
        },
        mileages: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        },
        zone: true
      }
    });

    const upcoming = [];
    const overdue = [];

    cars.forEach(car => {
      car.maintenances.forEach(maintenance => {
        const item = { car, maintenance };
        if (maintenance.status === 'OVERDUE') {
          overdue.push(item);
        } else {
          upcoming.push(item);
        }
      });
    });

    res.status(200).json({ upcoming, overdue });
  } catch (error) {
    console.error('Error fetching upcoming maintenances:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming maintenances' });
  }
};



exports.completeMaintenance = async (req, res) => {
  try {
    const { maintenanceId, date, recordedMileage, cost } = req.body;

    // Handle file upload
    let factureUrl = null;
    if (req.file) {
      try {
        const uploadDir = path.join(__dirname, '../uploads/factures');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const fileExt = path.extname(req.file.originalname);
        const fileName = `facture_${Date.now()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);
        
        await fs.promises.rename(req.file.path, filePath);
        factureUrl = `${process.env.BACKEND_URL}/factures/${fileName}`;
      } catch (fileError) {
        console.error('File upload error:', fileError);
        return res.status(500).json({ error: 'Failed to process invoice file' });
      }
    }

    // Get maintenance with car and latest mileage
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        car: {
          include: {
            zone: true,
            mileages: {
              orderBy: { recordedAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!maintenance || maintenance.car.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized maintenance access' });
    }
    const submittedMileage = parseInt(recordedMileage);
    const costValue = parseFloat(cost);
    const dateValue = new Date(date);

    // Transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      await tx.mileage.create({
        data: {
          value: submittedMileage,
          recordedAt: dateValue,
          car: {
            connect: { id: maintenance.car.id }
          }
        }
      });

      // Update maintenance with submitted mileage
      const updatedMaintenance = await tx.maintenance.update({
        where: { id: maintenanceId },
        data: {
          date: dateValue,
          recordedMileage: submittedMileage,
          cost: costValue,
          factureUrl,
          status: 'DONE'
        }
      });

      return updatedMaintenance;
    });

    const completionNotification = await prisma.notification.create({
      data: {
        title: 'Maintenance Completed',
        message: `${maintenance.description} completed for ${maintenance.car.licensePlate}`,
        type: 'MAINTENANCE_COMPLETED',
        user_id: maintenance.car.zone.chef_park_id
      }
    });

    // Admin notification
    await prisma.notification.create({
      data: {
        title: 'Maintenance Completed',
        message: `${maintenance.description} completed for ${maintenance.car.licensePlate} in ${maintenance.car.zone.zone_name}`,
        type: 'MAINTENANCE_COMPLETED_ADMIN',
        user_id: platformAdmin.id
      }
    });

    return completionNotification

    res.status(200).json(result);
  } catch (error) {
    console.error('Error completing maintenance:', error);
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
};

exports.showMaintenanceDemographic = async (req, res) => {
  try {    
    const zones = await prisma.zone.findMany({
      where: { chef_park_id: req.user.id },
      include: {
        cars: {
          include: {
            maintenances: {
              where: {
                status: { in: ['DONE'] }
              }
            }
          }
        }
      }
    });

    const mapData = zones.map(zone => ({
      id: zone.id,
      name: zone.zone_name,
      vehiclesInService: zone.cars.length, 
      vehiclesUnderMaintenance: zone.cars.filter(car => 
        car.maintenances && car.maintenances.length > 0
      ).length
    }));

    

    res.json(mapData);
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message // Send error details to client
    });
  }

};


