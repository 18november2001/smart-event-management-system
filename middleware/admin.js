// Middleware: block non-admin users
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('403', { title: '403 - Access Denied' });
};

module.exports = isAdmin;
