import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, eq, count } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const emailLower = email.toLowerCase().trim();

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const [countResult] = await db.select({ count: count() }).from(usersTable);
    const isFirstUser = (countResult?.count ?? 0) === 0;

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = isFirstUser || adminEmails.includes(emailLower);

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({ email: emailLower, passwordHash, isAdmin })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        isAdmin: usersTable.isAdmin,
        createdAt: usersTable.createdAt,
      });

    req.session.user = user;
    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Session save error during registration");
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

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

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

router.get("/auth/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.session.user });
});

export default router;
