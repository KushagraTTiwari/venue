const express = require('express');
const router = express.Router();
const { createVenue, getVenue } = require('../controllers/venueController');
const { createActivity } = require('../controllers/activityController');
const { createReview } = require('../controllers/reviewController');

router.get('/venueActivity', getVenue);
router.post('/createVenue',createVenue);
router.post('/createActivity',createActivity);
router.post('/createReview',createReview);

module.exports = router;