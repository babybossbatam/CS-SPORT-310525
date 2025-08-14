import express, { type Request, Response, NextFunction } from "express";
import logoRoutes from './routes/logoRoutes';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simplified error handlers to prevent crashes without aggressive cleanup
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Don't force GC as it can cause instability
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Just log the rejection without trying to handle the promise
});

// Handle EventEmitter warnings with simple suppression
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    // Just suppress these warnings to prevent log spam
    return;
  }
  console.warn('Process Warning:', warning.message);
});

// Simple memory monitoring without aggressive cleanup
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  
  // Only log if memory is very high, don't take action
  if (heapUsedMB > 1800) {
    console.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB`);
  }
};

// Check memory less frequently to reduce overhead
setInterval(monitorMemory, 60000);

// Set reasonable limits to prevent EventEmitter warnings
process.setMaxListeners(50);
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 50;

// Simple graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  const tryListen = (retryPort: number) => {
    const serverInstance = server.listen(retryPort, "0.0.0.0", () => {
      log(`serving on port ${retryPort}`);
    });

    // Improve connection handling to prevent disconnects
    serverInstance.keepAliveTimeout = 65000; // 65 seconds
    serverInstance.headersTimeout = 66000;   // 66 seconds (slightly higher)
    
    // Handle server errors gracefully
    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && retryPort < 5010) {
        log(`Port ${retryPort} in use, trying ${retryPort + 1}`);
        if (retryPort + 1 <= 5010) {
            tryListen(retryPort + 1);
        } else {
            console.error("Failed to find an open port between 5000 and 5010");
        }
      } else {
        console.error("Failed to start server:", err);
      }
    });

    // Handle client disconnections gracefully
    serverInstance.on('clientError', (err, socket) => {
      if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });

    return serverInstance;
  };
  tryListen(Number(port));
})();