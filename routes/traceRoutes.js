// backend/routes/traceRoutes.js
const express = require('express');
const router  = express.Router();
const {
    getTraceByBatch, getAllTraceLogs,
    createTraceLog, updateTraceLog, deleteTraceLog,
} = require('../controllers/traceController');
const auth = require('../middlewares/auth'); // ← export thẳng function

router.get('/',          auth, getAllTraceLogs);  // GET /api/trace?batch_id=B001
router.get('/:batchId',  getTraceByBatch);        // GET /api/trace/B001
router.post('/',         auth, createTraceLog);   // POST /api/trace
router.put('/:id',       auth, updateTraceLog);   // PUT /api/trace/:id
router.delete('/:id',    auth, deleteTraceLog);   // DELETE /api/trace/:id

module.exports = router;