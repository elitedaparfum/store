import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";


const app: Express = express();

// Trust reverse proxy (Railway in prod) so req.secure reflects HTTPS
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security Headers ──
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── CORS ──
// Build allowed origins list from env vars
const allowedOrigins = new Set<string>();

const allowedOriginsStr =
  process.env.ALLOWED_ORIGINS ||
  "https://elite-da-parfum.vercel.app,https://elitedaparfum.com,https://www.elitedaparfum.com";

allowedOriginsStr
  .split(",")
  .map(d => d.trim())
  .filter(Boolean)
  .forEach(o => allowedOrigins.add(o));

// Replit dev domains
(process.env.REPLIT_DOMAINS ?? "")
  .split(",")
  .map(d => d.trim())
  .filter(Boolean)
  .flatMap(d => [`https://${d}`, `http://${d}`])
  .forEach(o => allowedOrigins.add(o));

// Local dev
allowedOrigins.add("http://localhost:80");
allowedOrigins.add("http://localhost:19998");
allowedOrigins.add("http://localhost:5173");

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) { cb(null, true); return; }
      const originDomain = origin.replace(/^https?:\/\//, "");
      
      if (
        allowedOrigins.size === 0 || 
        allowedOrigins.has(origin) || 
        origin.endsWith(".vercel.app") ||
        originDomain === "elitedaparfum.com" ||
        originDomain === "www.elitedaparfum.com"
      ) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


app.use("/api", router);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err }, message);
  res.status(500).json({ error: message });
});

export default app;
