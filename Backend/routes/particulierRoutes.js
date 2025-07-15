const express = require('express');
const { authenticate, authorize } = require('../middleware/authHandler');

const {
    getCars,
    saveCar,
    deleteCar,
    checkCarForMaintenance,
    getMaintenances,
    saveMaintenance,
    deleteMaintenance
} = require ('../controllers/particulierController')

const router = express.Router();
router.use(authenticate, authorize('PARTICULIER'));

router.get('/my-cars', getCars);
router.post('/my-cars/create-car', saveCar);
router.put('/my-cars/update-car/:id', saveCar);
router.delete('/my-cars/delete-car/:id', deleteCar);

router.get('/my-maintenances/car/:id', checkCarForMaintenance);

router.get('/my-maintenances', getMaintenances);
router.post('/my-maintenances/create-maintenance', saveMaintenance);
router.put('/my-maintenances/update/:id', saveMaintenance);
router.delete('/my-maintenances/delete/:id', deleteMaintenance);

module.exports = router;