import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep existing user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define types for Redis data structures
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
  currentStatus: string;
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
  resultsMetadata: ResultsMetadata;
  configuration: BotConfiguration;
};

export type ResultsMetadata = {
  profit: number;
  trades: number;
  winRate: number;
  profitFactor?: number;
  maxDrawdown?: number;
  avgTradeDuration?: number;
  sharpeRatio?: number;
  marketHistory?: MarketHistory;
};

export type MarketHistory = {
  startPrice: number;
  endPrice: number;
  highPrice: number;
  lowPrice: number;
  volatility?: number;
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
  id: string;
  type: 'LONG' | 'SHORT';
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  size: number;
  fee?: number;
  slippage?: number;
  reason?: string;
};

// SessionId format helper (used throughout the app)
export function formatSessionId(
  symbol: string,
  timeframe: string,
  startTimestamp: number,
  endTimestamp: number
): string {
  return `${symbol}:${timeframe}:${startTimestamp}:${endTimestamp}`;
}

// Parse a session ID into its components
export function parseSessionId(sessionId: string): {
  symbol: string;
  timeframe: string;
  startTimestamp: number;
  endTimestamp: number;
} {
  const [symbol, timeframe, startTimestampStr, endTimestampStr] = sessionId.split(':');
  
  return {
    symbol,
    timeframe,
    startTimestamp: parseInt(startTimestampStr, 10),
    endTimestamp: parseInt(endTimestampStr, 10)
  };
}

// Bot run ID format helper
export function formatBotRunId(sessionId: string, configHash: string): string {
  return `${sessionId}:${configHash}`;
}
