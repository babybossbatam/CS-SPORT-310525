import express, { type Request, Response, NextFunction } from "express";
import logoRoutes from './routes/logoRoutes';
import playerVerificationRoutes from './routes/playerVerificationRoutes.js';
import headtoheadRoutes from './routes/headtoheadRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Improved error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Don't exit, let it continue
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // Don't exit, let it continue
});

// Set reasonable timeout for requests
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});



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
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  const tryListen = (retryPort: number) => {
    server.listen(retryPort, "0.0.0.0", () => {
      log(`serving on port ${retryPort}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && retryPort < 5010) {
        log(`Port ${retryPort} in use, trying ${retryPort + 1}`);
        if (retryPort + 1 <= 5010) {
            tryListen(retryPort + 1);
        } else {
            console.error("Failed to find an open port between 5000 and 5010");
            // Don't exit immediately, let the process manager handle restarts
            setTimeout(() => process.exit(1), 1000);
        }
      } else {
        console.error("Failed to start server:", err);
        // Don't exit immediately, let the process manager handle restarts
        setTimeout(() => process.exit(1), 1000);
      }
    });
  };
  tryListen(Number(port));
})();