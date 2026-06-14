const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const verifyJWT = require('../middleware/auth');

router.use(verifyJWT);

router.get('/settings', testimonialController.getSettings);
router.post('/settings', testimonialController.updateSettings);
router.get('/analytics', testimonialController.getAnalytics);

router.post('/', testimonialController.create);
router.get('/', testimonialController.getAll);
router.get('/export', testimonialController.exportCSV);
router.get('/:testimonialId', testimonialController.getOne);
router.put('/:testimonialId', testimonialController.update);
router.patch('/:testimonialId/status', testimonialController.updateStatus);
router.delete('/:testimonialId', testimonialController.remove);
router.post('/:testimonialId/share', testimonialController.share);

module.exports = router;