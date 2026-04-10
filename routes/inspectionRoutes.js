const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const {
    getInspections,
    createInspection,
    updateInspection,
    deleteInspection,
} = require('../controllers/inspectionController');

router.use(auth);
router.get('/', roleCheck('admin'), getInspections);
router.post('/', roleCheck('admin'), createInspection);
router.put('/:id', roleCheck('admin'), updateInspection);
router.delete('/:id', roleCheck('admin'), deleteInspection);

module.exports = router;

