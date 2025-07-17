const express = require('express');
const { authenticate, authorize } = require('../middleware/authHandler');
const {
  getMyZones,
  getZoneById,
  addZone,
  deleteZone
} = require('../controllers/zoneController');

const {
  getMyBudget,
  createBudget,
  updateBudget
} = require('../controllers/budgetController');

const {
  getCarsInMyZones,
  getCarById,
  getCarsByZoneId,
  addCarInZone,
  updateCar,
  deleteCar,
  transferCar
} = require('../controllers/carController');

const {
  getMaintenances,
  createMaintenance,
  getMaintenanceHistory,
  planMaintenance,
  getUpcomingMaintenances,
  completeMaintenance,
} = require('../controllers/maintenanceController');

const {
  showMaintenanceDemographic,
  getZonesMetrics,
  getMonthlyMaintenance,
  getRecentMaintenances,
  getBudgetUtilization
} = require('../controllers/chefDashboardController')

const {
   addMileage 
} = require('../controllers/mileageController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Ensure base uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir, // Use the base uploads directory
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});


const router = express.Router();
router.use(authenticate, authorize('CHEF_PARK'));

//Dashboard
router.get('/my-zones/maintenance-map-data', showMaintenanceDemographic);
router.get('/my-zones/zone-metrics', getZonesMetrics);
router.get('/my-maintenances/recent-maintenances', getRecentMaintenances);
router.get('/my-maintenances/monthly-maintenance', getMonthlyMaintenance);
router.get('/budget/budget-utilization', getBudgetUtilization);


//zones
router.get('/my-zones', getMyZones);
router.get('/my-zones/:id', getZoneById)
router.post('/zones/add', addZone);
router.delete('/zones/delete/:id', deleteZone);

//budget
router.get('/budget', getMyBudget)
router.post('/budget/add', createBudget);
router.put('/budget/update/:id', updateBudget);


//Car
router.get('/my-cars', getCarsInMyZones);
router.get('/my-cars/:id', getCarById);
router.get('/my-cars/zone/:zoneId', getCarsByZoneId);
router.post('/my-cars/add', addCarInZone);
router.put('/my-cars/update/:id', updateCar);
router.delete('/my-cars/delete/:id', deleteCar);
router.patch('/my-cars/transfer/:id', transferCar);

//Maintenance

router.get('/my-maintenances/upcoming', getUpcomingMaintenances)
router.get('/my-maintenances', getMaintenances);
router.post('/my-maintenances/add', upload.single('facture'), createMaintenance);
router.get('/my-maintenances/history/:carId', getMaintenanceHistory);
router.post('/my-maintenances/plan', planMaintenance)
router.put('/my-maintenances/upcoming/complete/:id', upload.single('facture'), completeMaintenance)

//Mileage
router.post('/my-mileages/add', addMileage)


module.exports = router;