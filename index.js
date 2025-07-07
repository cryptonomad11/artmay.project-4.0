// server/index.ts
import express2 from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

// server/routes.ts
import { createServer } from "http";
import { z } from "zod";
var contactSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ung\xFCltige E-Mail-Adresse"),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen haben"),
  phase: z.enum(["phase1", "phase2", "phase3", "all"]).optional()
});
async function registerRoutes(app2) {
  app2.post("/api/contact", async (req, res) => {
    try {
      const data = contactSchema.parse(req.body);
      console.log("Contact form submission:", data);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      res.json({
        success: true,
        message: "Vielen Dank f\xFCr Ihre Anfrage! Wir melden uns binnen 24 Stunden bei Ihnen."
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({
        success: false,
        message: "Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut."
      });
    }
  });
  app2.post("/api/calculate-roi", async (req, res) => {
    try {
      const { compliance, ecommerce, ai, operatingCosts } = req.body;
      const totalValue = compliance + ecommerce + ai;
      const netProfit = totalValue - operatingCosts;
      const roi = Math.round(netProfit / operatingCosts * 100);
      res.json({
        totalValue,
        netProfit,
        roi,
        breakdown: {
          compliance,
          ecommerce,
          ai,
          operatingCosts
        }
      });
    } catch (error) {
      console.error("ROI calculation error:", error);
      res.status(400).json({
        success: false,
        message: "Fehler bei der ROI-Berechnung"
      });
    }
  });
  app2.post("/api/newsletter", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({
          success: false,
          message: "Ung\xFCltige E-Mail-Adresse"
        });
      }
      console.log("Newsletter signup:", email);
      res.json({
        success: true,
        message: "Erfolgreich f\xFCr Newsletter angemeldet!"
      });
    } catch (error) {
      console.error("Newsletter signup error:", error);
      res.status(400).json({
        success: false,
        message: "Fehler bei der Anmeldung"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
if (app.get("env") === "production") {
  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
    // Needed for PDF generation
  }));
  app.use(cors({
    origin: false,
    // Block all cross-origin requests
    credentials: false
  }));
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 20,
    // Limit each IP to 20 requests per windowMs
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false
  });
  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1e3,
    // 1 hour
    max: 3,
    // Limit contact form to 3 submissions per hour per IP
    message: { error: "Too many contact submissions, please try again later." },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use("/api", apiLimiter);
  app.use("/api/contact", contactLimiter);
  app.use((req, res, next) => {
    const userAgent = req.get("User-Agent") || "";
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i,
      /scanner/i,
      /vulnerability/i,
      /exploit/i
    ];
    const legitBots = /googlebot|bingbot|slurp|duckduckbot/i;
    if (suspiciousPatterns.some((pattern) => pattern.test(userAgent)) && !legitBots.test(userAgent)) {
      log(`Blocked suspicious request from ${req.ip}: ${userAgent}`);
      return res.status(403).json({ error: "Access denied" });
    }
    const suspiciousHeaders = ["x-forwarded-for", "x-real-ip", "x-originating-ip"];
    for (const header of suspiciousHeaders) {
      if (req.get(header)) {
        log(`Blocked request with suspicious header ${header} from ${req.ip}`);
        return res.status(403).json({ error: "Access denied" });
      }
    }
    next();
  });
}
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 3e3;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();
