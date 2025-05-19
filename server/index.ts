import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add middleware to set headers for video embedding
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vimeo.com https://*.vimeocdn.com https://www.youtube.com https://s.ytimg.com; " +
    "frame-src https://*.vimeo.com https://player.vimeo.com https://www.youtube.com https://youtube.com; " +
    "img-src 'self' data: https: http:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "media-src 'self' https://*.vimeo.com https://*.vimeocdn.com https://media.w3.org; " +
    "connect-src 'self' https://*.vimeo.com https://www.youtube.com;"
  );
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;

  const startServer = async (retries = 3) => {
    try {
      await new Promise((resolve, reject) => {
        server.listen({
          port,
          host: "0.0.0.0",
          reusePort: false,
        }, () => {
          log(`serving on port ${port}`);
          resolve(null);
        }).on('error', reject);
      });
    } catch (error: any) {
      if (error.code === 'EADDRINUSE' && retries > 0) {
        console.log(`Port ${port} in use, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return startServer(retries - 1);
      }
      throw error;
    }
  };

  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
})();