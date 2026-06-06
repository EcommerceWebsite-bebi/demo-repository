const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
async function register(req, res) {
  const { username, email, password, phone, address } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
  }

  try {
    // Check if user exists
    const userExists = await query.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Get default role (USER)
    const userRole = await query.get("SELECT id FROM roles WHERE name = 'USER'");
    const roleId = userRole ? userRole.id : 1;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query.run(`
      INSERT INTO users (username, email, password, phone, address, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, email.toLowerCase(), hashedPassword, phone || null, address || null, roleId]);

    // Create a cart for the new user automatically
    await query.run('INSERT INTO carts (user_id) VALUES (?)', [result.id]);

    // Generate token
    const token = generateToken(result.id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        username,
        email: email.toLowerCase(),
        phone: phone || null,
        address: address || null,
        role_name: 'USER'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    // Find user by email
    const user = await query.get(`
      SELECT u.*, r.name as role_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email.toLowerCase()]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user has a cart, create if not (backwards compatibility/seeding fallback)
    const cart = await query.get('SELECT id FROM carts WHERE user_id = ?', [user.id]);
    if (!cart) {
      await query.run('INSERT INTO carts (user_id) VALUES (?)', [user.id]);
    }

    // Generate token
    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        role_name: user.role_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  return res.status(200).json({
    success: true,
    user: req.user
  });
}

module.exports = {
  register,
  login,
  getMe
};
