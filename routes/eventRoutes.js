const express = require('express');
const router = express.Router();
const {
  getManage,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const isLoggedIn = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Admin only: manage page (must be before /:id to avoid Express treating "manage" as an ID)
router.get('/manage', isLoggedIn, isAdmin, getManage);

// Public: event detail
router.get('/:id', getEventDetail);

// Admin only: create event
router.post('/', isLoggedIn, isAdmin, createEvent);

// Admin only: update event
router.post('/:id/edit', isLoggedIn, isAdmin, updateEvent);

// Admin only: delete event
router.post('/:id/delete', isLoggedIn, isAdmin, deleteEvent);

module.exports = router;
