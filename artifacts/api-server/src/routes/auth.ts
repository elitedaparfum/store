import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db, usersTable, eq, count } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import jwt from "jsonwebtoken";

const signToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.SESSION_SECRET || "default_secret", { expiresIn: "7d" });
};

// ── Lazy Google OAuth Client ──
// Loaded lazily to prevent crashing the entire auth module if the library has issues
let _googleClient: any = null;
async function getGoogleClient() {
  if (!_googleClient) {
    try {
      const { OAuth2Client } = await import("google-auth-library");
      _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "dummy_client_id");
    } catch (err) {
      console.error("Failed to load google-auth-library:", err);
      throw new Error("Google authentication is not available");
    }
  }
  return _googleClient;
}

// ── Lazy Email Service ──
async function sendResetEmail(email: string, token: string, baseUrl: string) {
  try {
    const { sendPasswordResetEmail } = await import("../lib/email.js");
    await sendPasswordResetEmail(email, token, baseUrl);
  } catch (err) {
    console.error("Failed to send reset email:", err);
    throw err;
  }
}

// ── Validation Schemas ──

const registerSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

const googleLoginSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordPublicSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const adminResetPasswordSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100),
});

// ── Rate Limiting ──
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
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

    const existing = await db
      .select({ id: usersTable.id, googleId: usersTable.googleId })
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].googleId) {
         res.status(409).json({ error: "Account exists with Google Sign-In. Please use 'Sign in with Google'." });
         return;
      }
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

    const token = signToken(user.id);
    res.status(201).json({ user, token });
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

    if (!user.passwordHash) {
      res.status(401).json({ error: "Please use 'Sign in with Google' to log in to this account." });
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

    const token = signToken(safeUser.id);
    res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Google OAuth Login ──
router.post("/auth/google", async (req, res) => {
  if (!checkRateLimit(req, res)) return;

  try {
    const parseResult = googleLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Missing Google credential" });
      return;
    }
    
    // In dev without a client ID, we might need a mock for testing, but let's assume we have it.
    if (!process.env.GOOGLE_CLIENT_ID) {
      req.log.warn("GOOGLE_CLIENT_ID is not configured.");
    }

    const googleClient = await getGoogleClient();
    const ticket = await googleClient.verifyIdToken({
      idToken: parseResult.data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token" });
      return;
    }

    const emailLower = payload.email.toLowerCase().trim();
    const googleId = payload.sub;

    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    if (user) {
      // User exists, if they don't have googleId linked, we can link it
      if (!user.googleId) {
        const [updatedUser] = await db
          .update(usersTable)
          .set({ googleId })
          .where(eq(usersTable.id, user.id))
          .returning();
        user = updatedUser;
      }
    } else {
      // Create new user via Google
      const [countResult] = await db.select({ count: count() }).from(usersTable);
      const isFirstUser = (countResult?.count ?? 0) === 0;
      const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      const isAdmin = isFirstUser || adminEmails.includes(emailLower);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: emailLower,
          googleId,
          passwordHash: null, // No password for Google users
          isAdmin,
        })
        .returning();
      user = newUser;
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };

    const token = signToken(safeUser.id);
    res.json({ user: safeUser, token });

  } catch (err) {
    req.log.error({ err }, "Google Login error");
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// ── Forgot Password ──
router.post("/auth/forgot-password", async (req, res) => {
  if (!checkRateLimit(req, res)) return;

  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    const emailLower = parseResult.data.email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    // To prevent email enumeration, always return success even if user not found
    if (!user) {
      res.json({ success: true, message: "If an account exists, a reset link was sent." });
      return;
    }

    if (user.googleId && !user.passwordHash) {
      // Tell them to use Google login (could send an email or just return generic success)
      res.json({ success: true, message: "If an account exists, a reset link was sent." });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(usersTable)
      .set({ resetToken, resetTokenExpires: expires })
      .where(eq(usersTable.id, user.id));

    // Send email
    // Determine frontend base URL
    const origin = req.headers.origin || "https://elitedaparfum.com";
    await sendResetEmail(user.email, resetToken, origin);

    res.json({ success: true, message: "If an account exists, a reset link was sent." });
  } catch (err) {
    req.log.error({ err }, "Forgot password error");
    res.status(500).json({ error: "Failed to process request" });
  }
});

// ── Reset Password (Public) ──
router.post("/auth/reset-password", async (req, res) => {
  if (!checkRateLimit(req, res)) return;

  try {
    const parseResult = resetPasswordPublicSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const { token, newPassword } = parseResult.data;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.resetToken, token))
      .limit(1);

    if (!user || !user.resetTokenExpires || new Date() > user.resetTokenExpires) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(usersTable)
      .set({ 
        passwordHash, 
        resetToken: null, 
        resetTokenExpires: null 
      })
      .where(eq(usersTable.id, user.id));

    res.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    req.log.error({ err }, "Reset password error");
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ── Logout ──
router.post("/auth/logout", requireAuth, (req, res) => {
  res.json({ success: true });
});

// ── Current User ──
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ── Admin: Force Reset User Password ──
router.post("/auth/admin/reset-password", requireAdmin, async (req, res) => {
  try {
    const parseResult = adminResetPasswordSchema.safeParse(req.body);
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
    req.log.error({ err }, "Admin password reset error");
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
