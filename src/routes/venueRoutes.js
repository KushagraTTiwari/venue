const express = require('express');
const router = express.Router();
const { getVenue } = require('../controllers/venueController');

router.get('/venueActivity', getVenue);

module.exports = router;