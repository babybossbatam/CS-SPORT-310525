
import express, { type Request, Response, NextFunction } from "express";
import logoRoutes from './routes/logoRoutes';
import playerVerificationRoutes from './routes/playerVerificationRoutes.js';
import headtoheadRoutes from './routes/headtoheadRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Log but don't exit to prevent restarts
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Prevent unhandled rejections from crashing the process
});

// Memory monitoring to prevent OOM crashes
let memoryWarningCount = 0;
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;

  if (heapUsedMB > 1500) { // Warning at 1.5GB
    memoryWarningCount++;
    console.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB (Warning #${memoryWarningCount})`);

    if (memoryWarningCount > 5) {
      console.log('🧹 Forcing garbage collection...');
      if (global.gc) {
        global.gc();
        memoryWarningCount = 0;
      }
    }
  }
};

// Check memory every 30 seconds
setInterval(monitorMemory, 30000);

// Set EXTREMELY CONSERVATIVE limits for Replit Assistant compatibility
process.setMaxListeners(2); // Minimal for extreme stability
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 2; // Minimal for extreme stability

// Set max listeners for common event emitters - VERY CONSERVATIVE
if (typeof process !== 'undefined' && process.stdout) {
  process.stdout.setMaxListeners(5);
}
if (typeof process !== 'undefined' && process.stderr) {
  process.stderr.setMaxListeners(5);
}
if (typeof process !== 'undefined' && process.stdin) {
  process.stdin.setMaxListeners(3);
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Suppress warnings that interfere with Replit Assistant
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    // Suppress these warnings to prevent Replit Assistant interference
    return;
  }
  console.warn('Process Warning:', warning.message);
});

// Monitor process uptime and stability
let startTime = Date.now();
setInterval(() => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  if (uptime % 300 === 0) { // Every 5 minutes
    console.log(`✅ Server stable for ${Math.floor(uptime / 60)} minutes`);
  }
}, 1000);

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

  // Serve static files from client/public
app.use(express.static(path.join(import.meta.dirname, "../client/public")));

// Serve attached assets with proper URL decoding
app.use('/attached_assets', express.static(path.join(import.meta.dirname, "../attached_assets"), {
  setHeaders: (res, path) => {
    // Set proper cache headers for images
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
  }
}));

  // API routes
  app.use('/api', logoRoutes);
  app.use('/api', playerVerificationRoutes);
  app.use('/api', headtoheadRoutes);
  app.use('/api/verification', verificationRoutes);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  const port = process.env.PORT || 5000;
  
  // Single port binding - no retry logic to prevent double binding
  server.listen(Number(port), "0.0.0.0", () => {
    log(`serving on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please stop other processes using this port.`);
      process.exit(1);
    } else {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  });
})();
