import express, { Express, Request, Response } from 'express';
import http from 'http';
import { redisClient } from './lib/redis';
import { storage } from './storage';
import { formatSessionId, parseSessionId } from '@shared/schema';

export async function registerRoutes(app: Express): Promise<void> {
  // Initialize Redis connection
  try {
    await redisClient.connect();
    console.log('Redis connection attempt complete');
  } catch (error) {
    console.error('Failed to connect to Redis, continuing without it:', error);
  }

  // Session endpoints
  app.get("/api/sessions", async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session);
    } catch (error) {
      console.error(`Error fetching session ${req.params.sessionId}:`, error);
      res.status(500).json({ error: 'Failed to fetch session details' });
    }
  });

  app.get("/api/sessions/:sessionId/bots", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      
      // Parse query parameters
      const status = req.query.status as string | undefined;
      const minProfit = req.query.minProfit ? parseFloat(req.query.minProfit as string) : undefined;
      const maxProfit = req.query.maxProfit ? parseFloat(req.query.maxProfit as string) : undefined;
      const cursor = req.query.cursor as string || '0';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      
      const result = await storage.getBotRunsForSession(sessionId, {
        status,
        minProfit,
        maxProfit,
        cursor,
        limit
      });
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching bots for session ${req.params.sessionId}:`, error);
      res.status(500).json({ error: 'Failed to fetch bots for session' });
    }
  });

  app.get("/api/sessions/:sessionId/bots/:configHash", async (req: Request, res: Response) => {
    try {
      const { sessionId, configHash } = req.params;
      
      const botRun = await storage.getBotRun(sessionId, configHash);
      
      if (!botRun) {
        return res.status(404).json({ error: 'Bot run not found' });
      }
      
      res.json(botRun);
    } catch (error) {
      console.error(`Error fetching bot run ${req.params.sessionId}/${req.params.configHash}:`, error);
      res.status(500).json({ error: 'Failed to fetch bot run details' });
    }
  });

  app.get("/api/sessions/:sessionId/bots/:configHash/trades", async (req: Request, res: Response) => {
    try {
      const { sessionId, configHash } = req.params;
      
      const trades = await storage.getTradesForBotRun(sessionId, configHash);
      
      res.json(trades);
    } catch (error) {
      console.error(`Error fetching trades for bot ${req.params.sessionId}/${req.params.configHash}:`, error);
      res.status(500).json({ error: 'Failed to fetch trades for bot run' });
    }
  });

  app.get("/api/sessions/:sessionId/bots/aggregate", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      
      const aggregateStats = await storage.getSessionAggregateStats(sessionId);
      
      res.json(aggregateStats);
    } catch (error) {
      console.error(`Error fetching aggregate stats for session ${req.params.sessionId}:`, error);
      res.status(500).json({ error: 'Failed to fetch aggregate stats for session' });
    }
  });

  // Redis status endpoint
  app.get("/api/status/redis", (req: Request, res: Response) => {
    res.json({ connected: storage.isRedisConnected() });
  });

  // Don't start the server here, let the main index.ts handle it
  return Promise.resolve();
}