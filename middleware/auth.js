// Authentication middleware for Passport sessions
const auth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If not authenticated, redirect to login
  res.redirect('/auth/login');
};

module.exports = auth; 