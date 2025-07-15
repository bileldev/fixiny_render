const express = require('express');
const { authenticate, authorize } = require('../middleware/authHandler');
const { 
  getAllUsers,
  deleteUser,
  changeUserStatus,

  showAllMaintenanceDemographic,
  getAllZonesMetrics,
  getAllMonthlyMaintenance,
  getAllRecentMaintenances,
  getTargetAchievement,

  createTarget,
  getTargets,
  updateTarget,

  getAllCars,
  getCarsByUser,
  getAllMaintenances,
  getMaintenanceHistoryByCar

} = require('../controllers/adminController');



const router = express.Router();

// Protect all routes with admin check
router.use(authenticate, authorize('ADMIN'));

//Users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/approve', changeUserStatus);

//Dashboard
router.get('/zones/maintenance-map-data', showAllMaintenanceDemographic)
router.get('/zones/zone-metrics', getAllZonesMetrics)
router.get('/maintenances/monthly-maintenance', getAllMonthlyMaintenance)
router.get('/maintenances/recent-maintenances', getAllRecentMaintenances)
router.get('/maintenances/recent-maintenances', getAllRecentMaintenances)
router.get('/target/target-achievement', getTargetAchievement)

//Profit
router.get('/targets', getTargets)
router.post('/targets/create-target', createTarget)
router.put('/targets/update-target/:id', updateTarget)

//Get all cars
router.get('/users/cars', getAllCars);

// Get all cars for a user
router.get('/users/:userId/cars', getCarsByUser);

// Get maintenance history for a car
router.get('/users/cars/:carId/maintenances', getMaintenanceHistoryByCar);

//Get all maintenances
router.get('/users/cars/maintenances', getAllMaintenances)

module.exports = router;