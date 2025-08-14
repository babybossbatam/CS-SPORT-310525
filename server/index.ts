import express, { type Request, Response, NextFunction } from "express";
import logoRoutes from './routes/logoRoutes';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Force garbage collection on critical errors
  if (global.gc) {
    global.gc();
  }
  // Log but don't exit to prevent restarts
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Clean up the promise to prevent memory leaks
  promise.catch(() => {});
});

// Handle EventEmitter warnings specifically
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    // Clean up excess listeners instead of just suppressing
    const emitter = warning.emitter;
    if (emitter && typeof emitter.removeAllListeners === 'function') {
      const eventNames = emitter.eventNames();
      eventNames.forEach(eventName => {
        const listeners = emitter.listeners(eventName);
        if (listeners.length > 50) {
          // Keep only the most recent 10 listeners
          const keepListeners = listeners.slice(-10);
          emitter.removeAllListeners(eventName);
          keepListeners.forEach(listener => emitter.on(eventName, listener));
        }
      });
    }
    return;
  }
  console.warn('Process Warning:', warning.message);
});

// Aggressive memory monitoring and cleanup
let memoryWarningCount = 0;
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > 1200) { // Earlier warning at 1.2GB
    memoryWarningCount++;
    console.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB (Warning #${memoryWarningCount})`);
    
    if (memoryWarningCount > 3) { // More aggressive cleanup
      console.log('🧹 Forcing garbage collection...');
      if (global.gc) {
        global.gc();
        memoryWarningCount = 0;
      }
      
      // Clear require cache for non-essential modules
      Object.keys(require.cache).forEach(key => {
        if (key.includes('node_modules') && 
            !key.includes('express') && 
            !key.includes('cors')) {
          delete require.cache[key];
        }
      });
    }
  }
};

// More frequent memory checks
setInterval(monitorMemory, 15000);

// Set reasonable limits to prevent EventEmitter warnings
process.setMaxListeners(100);
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 100;

// Set max listeners for common event emitters
if (typeof process !== 'undefined' && process.stdout) {
  process.stdout.setMaxListeners(100);
}
if (typeof process !== 'undefined' && process.stderr) {
  process.stderr.setMaxListeners(100);
}
if (typeof process !== 'undefined' && process.stdin) {
  process.stdin.setMaxListeners(50);
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

// Prevent exit on warnings
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    // Suppress these warnings instead of logging
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