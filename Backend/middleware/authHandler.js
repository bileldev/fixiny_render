const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

exports.authenticate = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1]; ;
  if (!token) return res.status(401).json({ error: "Unauthorized, Authentication required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from DB (avoid stale approval status)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        status: true,
        enterprise_id:true
      }
    });

    if (!user) return res.status(401).json({ error: "User not found" });
    
    // Block unapproved users (except admins)
    if (user.status !== 'APPROVED' && user.role !== 'ADMIN') {      
      return res.status(403).json({ 
        error: "Account not approved",
        details: "Contact your administrator" 
      });
    }

    req.user = user; // Attach fresh data
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired' });
    }
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden",
        details: `Required role: ${roles.join(', ')}` 
      });
    }
    next();
  };
};