import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {

  try{
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header is missing" });
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token is missing" });
    }

    const secret = process.env.JWT_SECRET;

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();

  }catch(err){
    return res.status(401).json({ error: "Your token is invalid/expired" });
  }
}


export function authorizeRole(requiredRole) {
  return (req, res, next) => {
    if(req.user.role !== requiredRole){
      return res.status(403).json({ error: "You do not have permission to access this resource" });
    }

    next();
  };
}