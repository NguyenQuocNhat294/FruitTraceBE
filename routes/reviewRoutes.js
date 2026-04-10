const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewsByBatch,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const auth = require('../middlewares/auth');

router.get('/batch/:batchId', getReviewsByBatch);
router.post('/', auth, createReview);
router.put('/:id', auth, updateReview);
router.delete('/:id', auth, deleteReview);

module.exports = router;