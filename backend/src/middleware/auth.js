import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        error: "Authorization header must be: Bearer <token>"
      });
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    // expired or invalid tokens are normal events, so no stack trace
    return res.status(401).json({ success: false, error: "Your token is invalid/expired" });
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