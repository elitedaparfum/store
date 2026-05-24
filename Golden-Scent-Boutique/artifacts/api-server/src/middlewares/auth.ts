import { type Request, type Response, type NextFunction } from "express";
import { type SafeUser } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    user: SafeUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  if (!req.session.user.isAdmin) {
    res.status(403).json({ error: "Forbidden. Admin access required." });
    return;
  }
  next();
}
