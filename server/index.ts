import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { storage } from './storage';
import http from 'http';

async function start() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Add basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In development mode, skip static file serving as Vite handles it
  try {
    if (process.env.NODE_ENV !== 'development') {
      serveStatic(app);
    } else {
      log('Development mode detected, skipping static file serving');
    }
  } catch (error) {
    console.warn('Static file serving disabled:', error);
  }

  // Create server before setting up routes and Vite
  const server = http.createServer(app);
  
  // Register API routes
  await registerRoutes(app);

  // Setup Vite for development
  if (process.env.NODE_ENV === 'development') {
    try {
      await setupVite(app, server);
      log('Vite development server started');
    } catch (error) {
      console.error('Error setting up Vite:', error);
    }
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  });

  // Log the Redis connection status
  log(`Redis connection status: ${storage.isRedisConnected() ? 'Connected' : 'Disconnected'}`);

  // Start the server on the configured port
  if (server) {
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server is running on port ${PORT}. Redis is ${storage.isRedisConnected() ? 'available' : 'unavailable - some features will be limited'}`);
    });
  } else {
    log(`Server is running. Redis is ${storage.isRedisConnected() ? 'available' : 'unavailable - some features will be limited'}`);
  }
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});