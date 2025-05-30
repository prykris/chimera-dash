import { Express, Request, Response } from 'express';
import { redisClient } from './lib/redis';
import { storage } from './storage';

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
    console.log("API /api/sessions hit");
    try {
      const sessions = await storage.getAllSessions();
      console.log("API /api/sessions got sessions:", sessions.length);
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

      console.log({ session, sessionId })

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

  app.get("/api/sessions/:sessionId/bots/:configHash", async (req: Request, res: Response) => {
    try {
      const { sessionId, configHash } = req.params;

      const botRun = await storage.getBotRun(sessionId, configHash);

      if (!botRun) {
        console.log("Bot run not found:", sessionId, configHash, botRun);
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

  // Redis status endpoint
  app.get("/api/status/redis", (req: Request, res: Response) => {
    res.json({ connected: storage.isRedisConnected() });
  });

  // Redis configuration endpoint
  app.post("/api/config/redis", async (req: Request, res: Response) => {
    try {
      const { host, port, password, database } = req.body;

      // Validate the configuration
      if (!host || !port || isNaN(Number(port)) || port <= 0 || port > 65535) {
        return res.status(400).json({ error: 'Invalid Redis configuration' });
      }

      // Format the Redis URL from the components
      const redisUrl = `redis://${password ? `:${password}@` : ''}${host}:${port}/${database || 0}`;

      // Set the environment variable for the current process
      process.env.REDIS_URL = redisUrl;

      // Attempt to reconnect to Redis with the new configuration
      try {
        // First disconnect if connected
        await redisClient.disconnect();
        // Then try to connect with new configuration
        const connected = await redisClient.connect();

        res.json({
          success: connected,
          connected,
          message: connected ? 'Redis connection updated successfully' : 'Failed to connect with new settings'
        });
      } catch (error) {
        console.error('Error reconnecting to Redis:', error);
        res.status(500).json({
          error: 'Failed to connect to Redis with new settings',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Error in Redis configuration endpoint:', error);
      res.status(500).json({ error: 'Failed to update Redis configuration' });
    }
  });

  // Market data API endpoint - Proxy for exchange APIs to avoid CORS issues
  app.get("/api/market/klines", async (req: Request, res: Response) => {
    try {
      const { symbol, interval, limit } = req.query;

      // Validate params
      if (!symbol) {
        return res.status(400).json({ error: "Symbol parameter is required" });
      }

      // Default values
      const queryInterval = interval || '1d';
      const queryLimit = limit || '30';

      // Build the URL for Binance API (public API)
      const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${queryInterval}&limit=${queryLimit}`;

      // Fetch data from Binance
      const response = await fetch(binanceUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.statusText}`);
      }

      const rawData = await response.json();

      // Transform the data to a friendlier format for our frontend
      const transformedData = rawData.map((kline: any) => ({
        date: new Date(kline[0]).toISOString().split('T')[0], // Open time
        price: parseFloat(kline[4]), // Close price
        volume: parseFloat(kline[5]), // Volume
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        open: parseFloat(kline[1]),
      }));

      res.json(transformedData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ error: "Failed to fetch market data from exchange" });
    }
  });

  // Don't start the server here, let the main index.ts handle it
  return Promise.resolve();
}