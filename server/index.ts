import express, { type Request, Response, NextFunction } from "express";
import logoRoutes from './routes/logoRoutes';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import cors from 'cors';

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

// Set higher limits to prevent EventEmitter warnings
process.setMaxListeners(8000);
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 8000;

// Set max listeners for common event emitters
if (typeof process !== 'undefined' && process.stdout) {
  process.stdout.setMaxListeners(8000);
}
if (typeof process !== 'undefined' && process.stderr) {
  process.stderr.setMaxListeners(8000);
}
if (typeof process !== 'undefined' && process.stdin) {
  process.stdin.setMaxListeners(500);
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

// Simplified CORS configuration for Replit
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all replit.dev origins
    if (origin.includes('replit.dev')) {
      return callback(null, true);
    }
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Default to allow for debugging
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Add explicit CORS headers for all requests as backup
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.host || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-API-Key');
  
  // Handle preflight requests explicitly
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.static('client/dist'));

// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: https: http:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self' https: wss: ws:; " +
    "frame-ancestors 'self';"
  );

  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
});

// Routes
app.use('/api', logoRoutes);

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
  const PORT = process.env.PORT || 5000;
  const HOST = '0.0.0.0'; // Important for Replit

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
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
})();