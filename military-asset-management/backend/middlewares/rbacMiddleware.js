export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

export const enforceBaseScope = (req, res, next) => {
  if (req.user && req.user.role === 'BASE_COMMANDER') {
    req.query.baseId = String(req.user.baseId);
  }
  next();
};
