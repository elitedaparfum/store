import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { sessionMiddleware } from "./lib/session.js";

const app: Express = express();

// Trust reverse proxy (Replit in dev, Railway in prod) so req.secure reflects HTTPS
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

// Build allowed origins list from env vars
// ALLOWED_ORIGINS — comma-separated list for production, e.g.:
//   https://elitedaparfum.vercel.app,https://elitedaparfum.com
const allowedOrigins = new Set<string>();

const allowedOriginsStr = process.env.ALLOWED_ORIGINS || "https://elite-da-parfum.vercel.app";

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
      if (allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
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
app.use(sessionMiddleware);

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
