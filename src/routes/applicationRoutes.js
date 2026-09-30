const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');

// POST /applications
router.post('/', ApplicationController.createApplication);

// GET /applications
router.get('/', ApplicationController.getApplications);

// PUT /applications/:id/status
router.put('/:id/status', ApplicationController.updateStatus);

module.exports = router;
