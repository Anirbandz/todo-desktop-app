const adminAuth = (req, res, next) => {
  try {
    // Check for admin credentials in headers or body
    const adminUsername = req.headers['admin-username'] || req.body.adminUsername;
    const adminPassword = req.headers['admin-password'] || req.body.adminPassword;
    
    // Universal admin credentials
    const UNIVERSAL_ADMIN_USERNAME = 'admin';
    const UNIVERSAL_ADMIN_PASSWORD = 'Master@1';
    
    // Check if credentials match
    if (adminUsername === UNIVERSAL_ADMIN_USERNAME && adminPassword === UNIVERSAL_ADMIN_PASSWORD) {
      // Add admin flag to request
      req.isAdmin = true;
      next();
    } else {
      return res.status(401).json({ 
        message: 'Admin access denied. Invalid credentials.' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      message: 'Admin authentication error' 
    });
  }
};

module.exports = adminAuth; 