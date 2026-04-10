// backend/routes/batchRoutes.js
const express = require('express');
const router  = express.Router();
const {
    getBatches, getBatchById, getBatchByCode,
    createBatch, updateBatch, deleteBatch, getBatchStats,
} = require('../controllers/batchController');
const auth = require('../middlewares/auth'); // ← export thẳng function

router.get('/stats',      auth, getBatchStats);   // GET /api/batches/stats
router.get('/code/:code', getBatchByCode);         // GET /api/batches/code/BATCH-001
router.get('/',           getBatches);             // GET /api/batches?farmid=F001
router.get('/:id',        getBatchById);           // GET /api/batches/:id
router.post('/',          auth, createBatch);      // POST /api/batches
router.put('/:id',        auth, updateBatch);      // PUT /api/batches/:id
router.delete('/:id',     auth, deleteBatch);      // DELETE /api/batches/:id

module.exports = router;