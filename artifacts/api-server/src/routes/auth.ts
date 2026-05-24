import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, usersTable, eq, count } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

// ── Validation Schemas ──

const registerSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

const resetPasswordSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100),
});

// ── Rate Limiting ──
// Simple in-memory rate limiter for auth endpoints.
// Tracks attempts per IP. Resets every window.

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 20; // max attempts per window

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: Request, res: Response): boolean {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();

  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many attempts. Please try again later." });
    return false;
  }
  return true;
}

// Clean up stale rate limit entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 30 * 60 * 1000);

// ── Router ──

const router: IRouter = Router();

// ── Register ──
router.post("/auth/register", async (req, res) => {
  if (!checkRateLimit(req, res)) return;

  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const { email, password } = parseResult.data;
    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    // Determine if this is the first user (auto-admin) or in admin list
    const [countResult] = await db.select({ count: count() }).from(usersTable);
    const isFirstUser = (countResult?.count ?? 0) === 0;

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = isFirstUser || adminEmails.includes(emailLower);
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const [user] = await db
      .insert(usersTable)
      .values({ email: emailLower, passwordHash, isAdmin })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        isAdmin: usersTable.isAdmin,
        createdAt: usersTable.createdAt,
      });

    // Save session — if this fails, roll back the user insert
    req.session.user = user;
    req.session.save(async (err) => {
      if (err) {
        req.log.error({ err }, "Session save error during registration");
        try {
          await db.delete(usersTable).where(eq(usersTable.id, user!.id));
        } catch (delErr) {
          req.log.error({ delErr }, "Failed to rollback user insert");
        }
        res.status(500).json({ error: "Registration failed. Please try again." });
        return;
      }
      res.status(201).json({ user });
    });
  } catch (err) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ── Login ──
router.post("/auth/login", async (req, res) => {
  if (!checkRateLimit(req, res)) return;

  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Invalid email or password format" });
      return;
    }
    const { email, password } = parseResult.data;
    const emailLower = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };

    req.session.user = safeUser;
    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Session save error");
        res.status(500).json({ error: "Login failed" });
        return;
      }
      res.json({ user: safeUser });
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Logout ──
router.post("/auth/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Logout error");
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// ── Current User ──
router.get("/auth/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.session.user });
});

// ── Admin: Reset User Password ──
router.post("/auth/reset-password", requireAdmin, async (req, res) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const { userId, newPassword } = parseResult.data;

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const [updated] = await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, email: usersTable.email });

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ success: true, email: updated.email });
  } catch (err) {
    req.log.error({ err }, "Password reset error");
    res.status(500).json({ error: "Password reset failed" });
  }
});

// ── Admin: List Users ──
router.get("/auth/users", requireAdmin, async (req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        isAdmin: usersTable.isAdmin,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(usersTable.createdAt);

    res.json({ users });
  } catch (err) {
    req.log.error({ err }, "Error fetching users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
