import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PostgreSQL schema for users table (if needed later)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Redis data types
export type SessionSummary = {
  symbol: string;
  timeframe: string;
  startTimestamp: number;
  endTimestamp: number;
  runCount: number;
  lastConfigHash: string;
  lastUpdate: number;
  bestProfit: number;
  bestConfigHash: string;
  currentProfit: number;
  currentStatus: 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
  avgProfit: number;
  errorCount: number;
  completedRuns: number;
  active: boolean;
  notes?: string;
};

export type BacktestRunRecord = {
  status: 'completed' | 'running' | 'failed';
  botId: string;
  configHash: string;
  lastUpdated: number;
  resultsMetadata?: {
    performance?: {
      profit?: number;
      sharpe?: number;
      maxDrawdown?: number;
      winRate?: number;
      numTrades?: number;
      trades?: Trade[];
      profitFactor?: number;
      avgTradeDuration?: number;
      // Add any other fields you store in performance
    };
    marketHistory?: {
      fills: any[];
      orders: any[];
      trades?: Trade[];
    };
  };
  configuration?: BotConfiguration;
};

export type BotConfiguration = {
  botId: string;
  strategy: {
    type: string;
    params: Record<string, any>;
  };
  riskManagement?: {
    stopLoss?: number;
    takeProfit?: number;
    trailingStop?: boolean;
    trailingStopDistance?: number;
    maxDrawdown?: number;
  };
  positionSizing?: {
    type: string;
    value: number;
  };
  timeframe: string;
  symbol: string;
};

export type Trade = {
  entryTimestamp: number;
  entryPrice: number;
  entrySize: number;
  exitTimestamp: number;
  exitPrice: number;
  exitSize: number;
  realizedPnl: number;
  type?: 'LONG' | 'SHORT'; // Added for backward compatibility
};

// Utility functions for working with Redis keys
export function formatSessionId(
  symbol: string,
  timeframe: string,
  startTimestamp: number,
  endTimestamp: number
): string {
  return `${symbol}:${timeframe}:${startTimestamp}-${endTimestamp}`;
}

export function parseSessionId(sessionId: string): {
  symbol: string;
  timeframe: string;
  startTimestamp: number;
  endTimestamp: number;
} {
  const [symbol, timeframe, startEnd] = sessionId.split(":");
  const [startTimestampStr, endTimestampStr] = startEnd.split("-");
  return {
    symbol,
    timeframe,
    startTimestamp: parseInt(startTimestampStr, 10),
    endTimestamp: parseInt(endTimestampStr, 10)
  };
}

export function formatBotRunId(sessionId: string, configHash: string): string {
  return `${sessionId}:${configHash}`;
}

// Redis key patterns
export const REDIS_KEYS = {
  SESSION: 'bot_registry:session_current',
  BOT_RUN: 'bot_registry:run:v1:context',
  TRADES: 'bot_performance:trades:v1:context',
};

// Format Redis keys for various entities
export function formatSessionKey(sessionId: string): string {
  return `${REDIS_KEYS.SESSION}:${sessionId}`;
}

export function formatBotRunKey(sessionId: string, configHash: string): string {
  return `${REDIS_KEYS.BOT_RUN}:${sessionId}:config:${configHash}`;
}

export function formatTradesKey(sessionId: string, configHash: string): string {
  return `${REDIS_KEYS.TRADES}:${sessionId}:config:${configHash}:trades`;
}

export function formatSessionBotsSetKey(sessionId: string): string {
  return `${REDIS_KEYS.BOT_RUN}:${sessionId}:config`;
}