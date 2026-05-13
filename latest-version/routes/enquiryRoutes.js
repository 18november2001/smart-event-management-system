const express = require('express');
const router = express.Router();
const {
  getEnquiries,
  submitEnquiry,
  updateEnquiryStatus,
  deleteEnquiry
} = require('../controllers/enquiryController');
const isLoggedIn = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Public: view contact form & submit
router.get('/', getEnquiries);
router.post('/', submitEnquiry);

// Admin only: update status & delete
router.post('/:id/status', isLoggedIn, isAdmin, updateEnquiryStatus);
router.post('/:id/delete', isLoggedIn, isAdmin, deleteEnquiry);

module.exports = router;
