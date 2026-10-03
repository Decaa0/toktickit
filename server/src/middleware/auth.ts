import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_lab3_toktickit";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded as AuthenticatedUser;
    next();
  });
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
}
