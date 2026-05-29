const { query } = require('../config/db');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
async function updateProfile(req, res) {
  const { phone, address, avatar, username } = req.body;
  const userId = req.user.id;

  try {
    const user = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newUsername = username !== undefined ? username : user.username;
    const newPhone = phone !== undefined ? phone : user.phone;
    const newAddress = address !== undefined ? address : user.address;
    const newAvatar = avatar !== undefined ? avatar : user.avatar;

    await query.run(`
      UPDATE users
      SET username = ?, phone = ?, address = ?, avatar = ?
      WHERE id = ?
    `, [newUsername, newPhone, newAddress, newAvatar, userId]);

    const updatedUser = await query.get(`
      SELECT u.id, u.username, u.email, u.avatar, u.phone, u.address, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userId]);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
}

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
async function getAllUsers(req, res) {
  try {
    const users = await query.all(`
      SELECT u.id, u.username, u.email, u.avatar, u.phone, u.address, u.role_id, r.name as role_name, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users' });
  }
}

module.exports = {
  updateProfile,
  getAllUsers
};
