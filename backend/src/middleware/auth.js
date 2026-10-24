import jwt from "jsonwebtoken";

// UPDATED: reads the token from the httpOnly cookie, not the Authorization header
export function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Your session is invalid or expired" });
  }
}

export function authorizeRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access this resource"
      });
    }
    next();
  };
}