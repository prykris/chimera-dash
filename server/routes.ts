import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { SessionSummary, BacktestRunRecord, Trade } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Sessions endpoints
  app.get("/api/sessions", async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error(`Error fetching session ${req.params.sessionId}:`, error);
      res.status(500).json({ message: "Failed to fetch session details" });
    }
  });

  // Bots in a session endpoints
  app.get("/api/sessions/:sessionId/bots", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      
      // Validate session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Parse query parameters
      const paramsSchema = z.object({
        status: z.string().optional(),
        minProfit: z.coerce.number().optional(),
        maxProfit: z.coerce.number().optional(),
        cursor: z.string().default('0'),
        limit: z.coerce.number().min(1).max(100).default(50),
      });
      
      const parseResult = paramsSchema.safeParse(req.query);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: parseResult.error.flatten() 
        });
      }
      
      const queryParams = parseResult.data;
      
      const result = await storage.getBotRunsForSession(
        sessionId, 
        queryParams
      );
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching bots for session ${req.params.sessionId}:`, error);
      res.status(500).json({ message: "Failed to fetch bot runs" });
    }
  });

  app.get("/api/sessions/:sessionId/bots/:configHash", async (req: Request, res: Response) => {
    try {
      const { sessionId, configHash } = req.params;
      
      const botRun = await storage.getBotRun(sessionId, configHash);
      
      if (!botRun) {
        return res.status(404).json({ message: "Bot run not found" });
      }
      
      res.json(botRun);
    } catch (error) {
      console.error(`Error fetching bot run ${req.params.configHash}:`, error);
      res.status(500).json({ message: "Failed to fetch bot run details" });
    }
  });

  // Trades endpoints
  app.get("/api/sessions/:sessionId/bots/:configHash/trades", async (req: Request, res: Response) => {
    try {
      const { sessionId, configHash } = req.params;
      
      const trades = await storage.getTradesForBotRun(sessionId, configHash);
      res.json(trades);
    } catch (error) {
      console.error(`Error fetching trades for bot ${req.params.configHash}:`, error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Bot configuration endpoint
  app.get("/api/sessions/:sessionId/bots/:configHash/config", async (req: Request, res: Response) => {
    try {
      const { sessionId, configHash } = req.params;
      
      const botRun = await storage.getBotRun(sessionId, configHash);
      
      if (!botRun) {
        return res.status(404).json({ message: "Bot run not found" });
      }
      
      res.json(botRun.configuration);
    } catch (error) {
      console.error(`Error fetching configuration for bot ${req.params.configHash}:`, error);
      res.status(500).json({ message: "Failed to fetch bot configuration" });
    }
  });

  // Aggregation endpoint
  app.get("/api/sessions/:sessionId/bots/aggregate", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Validate session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const stats = await storage.getSessionAggregateStats(sessionId);
      res.json(stats);
    } catch (error) {
      console.error(`Error fetching aggregate stats for session ${req.params.sessionId}:`, error);
      res.status(500).json({ message: "Failed to fetch aggregate statistics" });
    }
  });

  // Redis status endpoint
  app.get("/api/status/redis", (req: Request, res: Response) => {
    const isConnected = storage.isRedisConnected();
    res.json({ connected: isConnected });
  });

  const httpServer = createServer(app);

  return httpServer;
}
