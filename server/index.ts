import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { startEmailScheduler } from "./emailScheduler";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth, seedDefaultAdmin } from "./auth";
import { logCleanupService } from "./services/logCleanupService";
import { OrderCancelService } from "./services/orderCancelService";
import { pciComplianceService } from "./services/pciComplianceService";
import { storage } from "./storage";
import { initializeDefaultEmailTemplates } from "./emailTemplates";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Special handling for PWA files with correct MIME types
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.resolve(import.meta.dirname, '..', 'public', 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.resolve(import.meta.dirname, '..', 'public', 'manifest.json'));
});

// PWA icon files
app.get('/pwa-icon-192.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.resolve(import.meta.dirname, '..', 'public', 'pwa-icon-192.png'));
});

app.get('/pwa-icon-512.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.resolve(import.meta.dirname, '..', 'public', 'pwa-icon-512.png'));
});

// Create a simple favicon if it doesn't exist
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  // Send the pwa icon as favicon if favicon doesn't exist
  res.sendFile(path.resolve(import.meta.dirname, '..', 'public', 'pwa-icon-192.png'));
});

// Session configuration
const PgStore = connectPgSimple(session);
app.use(session({
  store: new PgStore({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'starlink-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup authentication systems
  setupAuth(app); // Admin authentication
  
  // Setup user authentication (separate from admin)  
  const { setupUserAuth } = await import('./userAuth');
  setupUserAuth(app);
  
  // PCI DSS: Setup 15-minute inactivity middleware for user sessions
  const { setupActivityMiddleware } = await import('./pciCompliance');
  setupActivityMiddleware(app);
  
  // Seed default admin user and initial ships
  await seedDefaultAdmin();
  
  const { seedInitialShips } = await import('./shipSeed');
  await seedInitialShips();
  
  // Initialize default email marketing templates
  await initializeDefaultEmailTemplates();
  
  // Start log cleanup service
  logCleanupService.startCleanupScheduler();
  
  // Start order auto-cancel service
  const orderCancelService = new OrderCancelService(storage);
  orderCancelService.start();
  
  // Start PCI DSS compliance service (90-day inactive account check)
  pciComplianceService.startScheduler();
  
  // Start email scheduler for monthly reports
  startEmailScheduler();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
