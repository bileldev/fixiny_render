//controllers/adminController
const prisma = require('../config/prisma');
const transporter = require('../config/mail')
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN' // Exclude users with ADMIN role
        }
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc' // Optional: sort by newest first
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Approve user
exports.changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expects { status: true/false }

    newStatus = status==true ? "APPROVED" : "REJECTED";
    
    const user = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        email: true,
        status: true
      }
    });    

    // Send email notification to user
    /*await transporter.sendMail({
      from: `"Fixiny Platform" <${process.env.ADMIN_EMAIL}>`,
      to: user.email,
      subject: `Account ${newStatus}`,
      html: `
        <h2>Your account has been ${newStatus.toLowerCase()}</h2>
        <p>Status: ${newStatus}</p>
        ${newStatus === 'APPROVED' ? 
          '<p>You can now login to your account.</p>' : 
          '<p>Please contact support for more information.</p>'}
      `
    });*/
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update approval status' });
  }
};

exports.getCars = async(req, res) => {
  try {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(cars);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
}

exports.getMaintenances = async(req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(maintenances);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenances' });
  }
}

exports.createTarget = async (req, res) => {
  try {
    const { amount, description, fiscalYear } = req.body;

    const budget = await prisma.budget.create({
      data: {
        amount,
        description,
        fiscalYear,
        isAdmin: true
      }
    });

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Budgets
exports.getTargets = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { isAdmin: true }, 
      orderBy: { fiscalYear: 'desc' }
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Budget
exports.updateTarget = async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    const updatedBudget = await prisma.budget.update({
      where: { id: req.params.id },
      data: { amount, description }
    });

    res.json(updatedBudget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.showAllMaintenanceDemographic = async (req, res) => {
  try {    
    const zones = await prisma.zone.findMany({
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

exports.getAllZonesMetrics = async (req, res) => {
  try {
    const zones = await prisma.zone.count();
    
    const cars = await prisma.car.count();

    res.json({
      sectors: zones,
      vehicles: cars
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllMonthlyMaintenance = async (req, res) => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Query database for monthly maintenance costs
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM m.date) as month,
        COALESCE(SUM(m.cost), 0) as total_cost
      FROM "Maintenance" m
      JOIN "Car" c ON m.car_id = c.id
      JOIN "Zone" z ON c.zone_id = z.id
      WHERE 
        EXTRACT(YEAR FROM m.date) = ${currentYear}
      GROUP BY month
      ORDER BY month
    `;

    // Format into 12-month array with type safety
    const result = Array(12).fill(0).map((_, index) => {
      const monthNumber = index + 1; // Months are 1-12
      const monthData = monthlyData.find(item => Number(item.month) === monthNumber);
      return monthData ? Number(monthData.total_cost) : 0;
    });

    res.json(result);
  } catch (error) {
    console.error("PostgreSQL query error:", {
      message: error.message,
      stack: error.stack,
      // PostgreSQL-specific error details if available
      code: error.code,  
      hint: error.hint
    });
    res.status(500).json({ 
      error: "Failed to fetch monthly data",
      details: error.message
    });
  }
};

exports.getAllRecentMaintenances = async (req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      where: {
        status: 'DONE',
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
      orderBy: { date: 'desc' },
      take: 5
    });

    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTargetAchievement = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // 1. Get the admin's target for current year
    const target = await prisma.budget.findFirst({
      where: { 
        isAdmin: true,
        fiscalYear: currentYear 
      },
      select: { amount: true }
    });

    // 2. Calculate actual maintenance revenue (gains)
    const maintenanceRevenue = await prisma.maintenance.aggregate({
      _sum: { cost: true },
      where: { 
        status: 'DONE',
        date: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      }
    });

    const targetAmount = target?.amount || 0;
    const gainedAmount = maintenanceRevenue._sum.cost || 0;
    const remainingAmount = Math.max(0, targetAmount - gainedAmount); // Prevent negative values
    
    // 3. Calculate percentage achieved (capped at 100%)
    const percentageAchieved = targetAmount > 0 
      ? Math.min(100, (gainedAmount / targetAmount) * 100)
      : 0;

    res.json({
      target: targetAmount,
      gained: gainedAmount,
      remaining: remainingAmount,
      percentage: percentageAchieved,
      year: currentYear,
      status: percentageAchieved >= 100 ? 'Target Achieved' : 'In Progress'
    });
  } catch (error) {
    console.error('Target achievement error:', error);
    res.status(500).json({ 
      error: "Failed to calculate target achievement",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      include: {
        zone: {
          select: {
            zone_name: true
          }
        },
        user: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(cars);
  } catch (error) {
    console.error('Get all cars error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cars',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllMaintenances = async (req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      where: { status: 'DONE', },
      include: {
        car: {
          include: {
            zone: {
              select: {
                zone_name: true
              }
            },
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      
      orderBy: {
        date: 'desc'
      }
    });
    res.json(maintenances);
  } catch (error) {
    console.error('Get all maintenances error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch maintenances',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getCarsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cars = await prisma.car.findMany({
      where: {
        user_id: userId
      },
      include: {
        zone: {
          select: {
            zone_name: true
          }
        },
        maintenances: {
          orderBy: {
            date: 'desc'
          },
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(cars);
  } catch (error) {
    console.error('Get cars by user error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user cars',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getMaintenanceHistoryByCar = async (req, res) => {
  try {
    const { carId } = req.params;

    const maintenanceHistory = await prisma.maintenance.findMany({
      where: {
        car_id: carId,
        status: 'DONE'  // Only completed maintenances
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
      orderBy: {
        date: 'desc'  // Newest first
      }
    });

    res.json({
      carDetails: maintenanceHistory[0]?.car, // Get car details from first record
      history: maintenanceHistory.map(m => ({
        id: m.id,
        type: m.type,
        date: m.date,
        recordedMileage: m.recordedMileage,
        cost: m.cost,
        description: m.description,
        factureUrl: m.factureUrl
      }))
    });
  } catch (error) {
    console.error('Get maintenance history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch maintenance history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};