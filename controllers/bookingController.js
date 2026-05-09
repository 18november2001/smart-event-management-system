const Booking = require('../models/Booking');
const Event = require('../models/Event');

// GET /bookings/dashboard — User: booking history | Admin: analytics
const getDashboard = async (req, res) => {
  try {
    const isAdmin = req.session.user.role === 'admin';

    if (isAdmin) {
      // Admin analytics
      const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
      const totalRevenue = await Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);

      // Top 5 most booked events
      const popularEvents = await Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$event', totalTickets: { $sum: '$ticketsBooked' } } },
        { $sort: { totalTickets: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' }
      ]);

      // All events with capacity usage
      const events = await Event.find().sort({ date: 1 });

      // Recent bookings
      const recentBookings = await Booking.find({ status: 'confirmed' })
        .populate('user', 'name email')
        .populate('event', 'title date')
        .sort({ createdAt: -1 })
        .limit(10);

      return res.render('bookings/dashboard', {
        title: 'Admin Dashboard',
        isAdmin: true,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        popularEvents,
        events,
        recentBookings,
        myBookings: null
      });
    }

    // Standard user: their own bookings
    const myBookings = await Booking.find({ user: req.session.user._id })
      .populate('event')
      .sort({ createdAt: -1 });

    res.render('bookings/dashboard', {
      title: 'My Bookings',
      isAdmin: false,
      myBookings,
      totalBookings: null,
      totalRevenue: null,
      popularEvents: null,
      events: null,
      recentBookings: null
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// POST /bookings — Book tickets for an event
const createBooking = async (req, res) => {
  const { eventId, ticketsBooked } = req.body;
  const tickets = Number(ticketsBooked);

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).render('404', { title: '404' });

    // Capacity check
    if (tickets < 1) {
      return res.redirect(`/events/${eventId}?error=Must book at least 1 ticket`);
    }

    if (event.availableSeats < tickets) {
      return res.redirect(`/events/${eventId}?error=Not enough seats available`);
    }

    // Duplicate booking check (handled by unique index, but catch it nicely)
    const existing = await Booking.findOne({ user: req.session.user._id, event: eventId });
    if (existing) {
      return res.redirect(`/events/${eventId}?error=You have already booked this event`);
    }

    const totalPrice = event.ticketPrice * tickets;

    await Booking.create({
      user: req.session.user._id,
      event: eventId,
      ticketsBooked: tickets,
      totalPrice
    });

    // Atomically increment bookedCount
    await Event.findByIdAndUpdate(eventId, { $inc: { bookedCount: tickets } });

    res.redirect('/bookings/dashboard?success=Booking confirmed');
  } catch (err) {
    console.error('Booking error:', err);
    // Handle duplicate key error from unique index
    if (err.code === 11000) {
      return res.redirect(`/events/${eventId}?error=You have already booked this event`);
    }
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// POST /bookings/:id/cancel — User cancels their own booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).render('404', { title: '404' });

    // Only the booking owner can cancel
    if (booking.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).render('403', { title: 'Access Denied' });
    }

    if (booking.status === 'cancelled') {
      return res.redirect('/bookings/dashboard?error=Booking already cancelled');
    }

    booking.status = 'cancelled';
    await booking.save();

    // Free up the seats
    await Event.findByIdAndUpdate(booking.event, {
      $inc: { bookedCount: -booking.ticketsBooked }
    });

    res.redirect('/bookings/dashboard?success=Booking cancelled');
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

module.exports = { getDashboard, createBooking, cancelBooking };
