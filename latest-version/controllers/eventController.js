const Event = require('../models/Event');

// GET / — Home listing with search & filter
const getHome = async (req, res) => {
  try {
    const { search, category, date, availability } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') filter.category = category;
    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: selectedDate, $lt: nextDay };
    }

    let events = await Event.find(filter).sort({ date: 1 });

    if (availability === 'available') events = events.filter(e => !e.isSoldOut);
    else if (availability === 'soldout') events = events.filter(e => e.isSoldOut);

    res.render('index', { title: 'Events', events, query: req.query });
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// GET /events/manage — Admin
const getManage = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.render('events/manage', { title: 'Manage Events', events, error: null });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// GET /events/:id — Event detail
const getEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).render('404', { title: '404' });
    res.render('events/detail', { title: event.title, event });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// POST /events — Create event
const createEvent = async (req, res) => {
  const { title, description, category, date, location, totalCapacity, ticketPrice, imageUrl } = req.body;
  try {
    await Event.create({
      title, description, category, date, location,
      totalCapacity: Number(totalCapacity),
      ticketPrice: Number(ticketPrice),
      imageUrl,
      createdBy: req.session.user._id
    });
    res.redirect('/events/manage');
  } catch (err) {
    console.error('Create event error:', err);
    const events = await Event.find().sort({ date: 1 });
    res.render('events/manage', { title: 'Manage Events', events, error: 'Failed to create event: ' + err.message });
  }
};

// POST /events/:id/edit — Update event
const updateEvent = async (req, res) => {
  const { title, description, category, date, location, totalCapacity, ticketPrice, imageUrl } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).render('404', { title: '404' });

    if (Number(totalCapacity) < event.bookedCount) {
      const events = await Event.find().sort({ date: 1 });
      return res.render('events/manage', {
        title: 'Manage Events', events,
        error: `Capacity cannot be less than already booked tickets (${event.bookedCount})`
      });
    }

    await Event.findByIdAndUpdate(req.params.id, {
      title, description, category, date, location,
      totalCapacity: Number(totalCapacity),
      ticketPrice: Number(ticketPrice),
      imageUrl
    });
    res.redirect('/events/manage');
  } catch (err) {
    console.error('Update event error:', err);
    res.redirect('/events/manage');
  }
};

// POST /events/:id/delete — Delete event
const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/events/manage');
  } catch (err) {
    console.error('Delete event error:', err);
    res.redirect('/events/manage');
  }
};

module.exports = { getHome, getManage, getEventDetail, createEvent, updateEvent, deleteEvent };
