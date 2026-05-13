const express = require('express');
const router = express.Router();
const { getDashboard, createBooking, cancelBooking } = require('../controllers/bookingController');
const isLoggedIn = require('../middleware/auth');

// All booking routes require login
router.use(isLoggedIn);

router.get('/dashboard', getDashboard);
router.post('/', createBooking);
router.post('/:id/cancel', cancelBooking);

module.exports = router;
