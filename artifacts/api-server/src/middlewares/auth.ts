import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: typeof usersTable.$inferSelect;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const secret = process.env.SESSION_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret) as { userId: string };

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return requireAuth(req, res, () => {
      if (!req.user?.isAdmin) {
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }
      next();
    });
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
};
