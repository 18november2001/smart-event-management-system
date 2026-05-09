// Middleware: block unauthenticated users
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

module.exports = isLoggedIn;
