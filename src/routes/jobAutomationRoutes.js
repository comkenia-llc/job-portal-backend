const express = require('express');
const router = express.Router();
const controller = require('../controllers/jobAutomationController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

router.post('/run', authMiddleware, adminMiddleware, controller.runAutomation);
router.get('/report', authMiddleware, adminMiddleware, controller.getAutomationReport);
router.get('/queue', authMiddleware, adminMiddleware, controller.listFallbackQueue);
router.post('/queue/:id/resolve', authMiddleware, adminMiddleware, controller.resolveQueueItem);
router.post('/queue/:id/reject', authMiddleware, adminMiddleware, controller.rejectQueueItem);

module.exports = router;
