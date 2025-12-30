const adminKeyFromEnv = process.env.ADMIN_KEY || '';

// Simple admin protection: check `x-admin-key` header or Bearer <ADMIN_KEY>
module.exports = (req, res, next) => {
  const header = req.headers['x-admin-key'] || req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Admin key required' });

  let key = header;
  if (header.startsWith('Bearer ')) key = header.split(' ')[1];

  if (!key || key !== adminKeyFromEnv) return res.status(403).json({ message: 'Invalid admin key' });

  // attach a lightweight admin identity
  req.user = { role: 'admin' };
  next();
};
