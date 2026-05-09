const User = require('../models/User');

// GET /register
const getRegister = (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register', { title: 'Register', error: null });
};

// POST /register
const postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Passwords do not match'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'An account with that email already exists'
      });
    }

    const user = await User.create({ name, email, password });

    // Auto-login after registration
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect('/');
  } catch (err) {
    console.error('Register error:', err);
    res.render('auth/register', {
      title: 'Register',
      error: 'Something went wrong. Please try again.'
    });
  }
};

// GET /login
const getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { title: 'Login', error: null });
};

// POST /login
const postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Redirect to original destination if session saved it
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      title: 'Login',
      error: 'Something went wrong. Please try again.'
    });
  }
};

// GET /logout
const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = { getRegister, postRegister, getLogin, postLogin, logout };
