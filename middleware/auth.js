const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });

  const token = auth.split(' ')[1] || auth;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // ensure role presence
    if (!payload.role) payload.role = 'employee';
    req.user = payload;
    next();
  } catch (err) {
    console.error('auth middleware error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};
