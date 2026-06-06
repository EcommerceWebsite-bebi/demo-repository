const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// Authenticate JWT Token
async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from database with role info
      const user = await query.get(`
        SELECT u.id, u.username, u.email, u.avatar, u.phone, u.address, u.role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `, [decoded.id]);

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
}

// Authorize Roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role_name} is not authorized to access this route`
      });
    }
    next();
  };
}

module.exports = {
  protect,
  authorize
};
