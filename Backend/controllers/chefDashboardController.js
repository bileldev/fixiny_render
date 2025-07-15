const prisma = require('../config/prisma');

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

exports.getZonesMetrics = async (req, res) => {
  try {
    const zones = await prisma.zone.count({
      where: { chef_park_id: req.user.id }
    });
    
    const cars = await prisma.car.count({
      where: { 
        zone: { chef_park_id: req.user.id }
      }
    });

    res.json({
      sectors: zones,
      vehicles: cars
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyMaintenance = async (req, res) => {
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
        z.chef_park_id = ${req.user.id}
        AND EXTRACT(YEAR FROM m.date) = ${currentYear}
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


exports.getRecentMaintenances = async (req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      where: {
        status: 'DONE',
        car: {
          zone: { chef_park_id: req.user.id }
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
      orderBy: { date: 'desc' },
      take: 5
    });

    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBudgetUtilization = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Get total budget for zones
    const zones = await prisma.zone.findMany({
      where: { chef_park_id: req.user.id },
      include: { budget: true }
    });

    const totalBudget = zones.reduce((sum, zone) => sum + (zone.budget?.amount || 0), 0);

    // Fixed raw query - removed comment syntax that caused error
    const yearlyCost = await prisma.$queryRaw`
      SELECT COALESCE(SUM(m.cost), 0) as total_cost
      FROM "Maintenance" m
      JOIN "Car" c ON m.car_id = c.id
      JOIN "Zone" z ON c.zone_id = z.id
      WHERE 
        z.chef_park_id = ${req.user.id}
        AND EXTRACT(YEAR FROM m.date) = ${currentYear}
        AND m.status = 'DONE'
    `;

    const usedBudget = Number(yearlyCost[0].total_cost);
    const remainingBudget = totalBudget - usedBudget;

    res.json({
      used: usedBudget,
      total: totalBudget,
      remaining: remainingBudget,
      percentage: totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0,
      year: currentYear
    });
  } catch (error) {
    console.error('Budget utilization error:', error);
    res.status(500).json({ 
      error: "Failed to calculate budget utilization",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};