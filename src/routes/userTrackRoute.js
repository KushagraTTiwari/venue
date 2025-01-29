// routes/userRoutes.js
const express = require('express');
const { trackUserClick, getUserTrackingData } = require('../controllers/userTrackController');
const { userBooking, getBookingsByUser } = require('../controllers/userBookingController')


const router = express.Router();

router.post('/track', trackUserClick);
router.get('/track/:userId', getUserTrackingData);
router.post('/booking', userBooking)
router.get('/booking/:userId', getBookingsByUser)

module.exports = router;
