export function requireCustomHeader(req, res, next) {
  const safe = ["GET", "HEAD", "OPTIONS"];
  if (safe.includes(req.method)) return next();
  if (req.headers["x-requested-with"] !== "XMLHttpRequest") {
    return res.status(403).json({ success: false, error: "Missing required header" });
  }
  next();
}