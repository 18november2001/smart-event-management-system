const Enquiry = require('../models/Enquiry');

// GET /enquiries — Contact form (public) | Admin: view all enquiries
const getEnquiries = async (req, res) => {
  try {
    const isAdmin = req.session.user?.role === 'admin';

    if (isAdmin) {
      const enquiries = await Enquiry.find().sort({ createdAt: -1 });
      return res.render('enquiries/contact', {
        title: 'Manage Enquiries',
        isAdmin: true,
        enquiries,
        success: null,
        error: null
      });
    }

    res.render('enquiries/contact', {
      title: 'Contact Us',
      isAdmin: false,
      enquiries: null,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Enquiry GET error:', err);
    res.status(500).render('error', { title: 'Error', message: err.message });
  }
};

// POST /enquiries — Submit a new enquiry
const submitEnquiry = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    await Enquiry.create({
      name,
      email,
      subject,
      message,
      user: req.session.user?._id || null
    });

    res.redirect('/enquiries?success=Your enquiry has been submitted. We will get back to you shortly.');
  } catch (err) {
    console.error('Submit enquiry error:', err);
    res.redirect('/enquiries?error=Failed to submit enquiry. Please try again.');
  }
};

// POST /enquiries/:id/status — Admin: update enquiry status
const updateEnquiryStatus = async (req, res) => {
  const { status } = req.body;

  try {
    await Enquiry.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/enquiries');
  } catch (err) {
    console.error('Update enquiry status error:', err);
    res.redirect('/enquiries');
  }
};

// POST /enquiries/:id/delete — Admin: delete an enquiry
const deleteEnquiry = async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.redirect('/enquiries');
  } catch (err) {
    console.error('Delete enquiry error:', err);
    res.redirect('/enquiries');
  }
};

module.exports = { getEnquiries, submitEnquiry, updateEnquiryStatus, deleteEnquiry };
