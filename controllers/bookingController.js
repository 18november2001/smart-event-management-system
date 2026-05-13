const Booking = require('../models/Booking');
const Event = require('../models/Event');

// GET /bookings/dashboard
const getDashboard = async (req, res) => {
  try {
    const isAdmin = req.session.user.role === 'admin';

    if (isAdmin) {
      const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
      const totalRevenueResult = await Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);
      const popularEvents = await Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$event', totalTickets: { $sum: '$ticketsBooked' } } },
        { $sort: { totalTickets: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' }
      ]);
      const events = await Event.find().sort({ date: 1 });
      const recentBookings = await Booking.find({ status: 'confirmed' })
        .populate('user', 'name email')
        .populate('event', 'title date')
        .sort({ createdAt: -1 })
        .limit(10);

      return res.render('bookings/dashboard', {
        title: 'Admin Dashboard',
        isAdmin: true,
        totalBookings,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        popularEvents,
        events,
        recentBookings,
        myBookings: null,
        query: req.query
      });
    }

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
      recentBookings: null,
      query: req.query
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// POST /bookings — Book tickets
const createBooking = async (req, res) => {
  const { eventId, ticketsBooked } = req.body;
  const tickets = Number(ticketsBooked);

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).render('404', { title: '404' });

    if (tickets < 1) return res.redirect(`/events/${eventId}?error=Must book at least 1 ticket`);
    if (event.availableSeats < tickets) return res.redirect(`/events/${eventId}?error=Not enough seats available`);

    const existing = await Booking.findOne({ user: req.session.user._id, event: eventId });
    if (existing) return res.redirect(`/events/${eventId}?error=You have already booked this event`);

    const totalPrice = event.ticketPrice * tickets;
    await Booking.create({ user: req.session.user._id, event: eventId, ticketsBooked: tickets, totalPrice });
    await Event.findByIdAndUpdate(eventId, { $inc: { bookedCount: tickets } });

    res.redirect('/bookings/dashboard?success=Booking confirmed');
  } catch (err) {
    console.error('Booking error:', err);
    if (err.code === 11000) return res.redirect(`/events/${eventId}?error=You have already booked this event`);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// POST /bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).render('404', { title: '404' });
    if (booking.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).render('403', { title: 'Access Denied' });
    }
    if (booking.status === 'cancelled') return res.redirect('/bookings/dashboard?error=Booking already cancelled');

    booking.status = 'cancelled';
    await booking.save();
    await Event.findByIdAndUpdate(booking.event, { $inc: { bookedCount: -booking.ticketsBooked } });

    res.redirect('/bookings/dashboard?success=Booking cancelled');
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

module.exports = { getDashboard, createBooking, cancelBooking };
