const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');

router.use(auth);

router.get('/', roleCheck('admin'), getAllUsers);
router.get('/:id', roleCheck('admin'), getUserById);
router.put('/:id', roleCheck('admin'), updateUser);
router.delete('/:id', roleCheck('admin'), deleteUser);

module.exports = router;