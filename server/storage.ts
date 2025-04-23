import { users, type User, type InsertUser, SessionSummary, BacktestRunRecord, Trade } from "@shared/schema";
import { redisClient } from "./lib/redis";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  getAllSessions(): Promise<SessionSummary[]>;
  getSession(sessionId: string): Promise<SessionSummary | null>;
  
  // Bot run methods
  getBotRun(sessionId: string, configHash: string): Promise<BacktestRunRecord | null>;
  getBotRunsForSession(sessionId: string, options?: {
    status?: string;
    minProfit?: number;
    maxProfit?: number;
    cursor?: string;
    limit?: number;
  }): Promise<{
    bots: Array<{ configHash: string; status: string; profit: number; botId: string; lastUpdated: number }>;
    nextCursor: string;
  }>;
  
  // Trade methods
  getTradesForBotRun(sessionId: string, configHash: string): Promise<Trade[]>;
  
  // Aggregation methods
  getSessionAggregateStats(sessionId: string): Promise<{
    totalBots: number;
    completedBots: number;
    runningBots: number;
    failedBots: number;
    avgProfit: number;
    bestProfit: number;
    worstProfit: number;
  }>;
  
  // Connectivity check
  isRedisConnected(): boolean;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Session methods
  async getAllSessions(): Promise<SessionSummary[]> {
    return redisClient.getAllSessions();
  }
  
  async getSession(sessionId: string): Promise<SessionSummary | null> {
    const [symbol, timeframe, startTimestampStr, endTimestampStr] = sessionId.split(':');
    const startTimestamp = parseInt(startTimestampStr);
    const endTimestamp = parseInt(endTimestampStr);
    
    return redisClient.getSession(symbol, timeframe, startTimestamp, endTimestamp);
  }
  
  // Bot run methods
  async getBotRun(sessionId: string, configHash: string): Promise<BacktestRunRecord | null> {
    const [symbol, timeframe, startTimestampStr, endTimestampStr] = sessionId.split(':');
    const startTimestamp = parseInt(startTimestampStr);
    const endTimestamp = parseInt(endTimestampStr);
    
    return redisClient.getBotRun(symbol, timeframe, startTimestamp, endTimestamp, configHash);
  }
  
  async getBotRunsForSession(
    sessionId: string, 
    options: {
      status?: string;
      minProfit?: number;
      maxProfit?: number;
      cursor?: string;
      limit?: number;
    } = {}
  ): Promise<{
    bots: Array<{ configHash: string; status: string; profit: number; botId: string; lastUpdated: number }>;
    nextCursor: string;
  }> {
    return redisClient.getBotRunsForSession(sessionId, options);
  }
  
  // Trade methods
  async getTradesForBotRun(sessionId: string, configHash: string): Promise<Trade[]> {
    const [symbol, timeframe, startTimestampStr, endTimestampStr] = sessionId.split(':');
    const startTimestamp = parseInt(startTimestampStr);
    const endTimestamp = parseInt(endTimestampStr);
    
    return redisClient.getTradesForBotRun(symbol, timeframe, startTimestamp, endTimestamp, configHash);
  }
  
  // Aggregation methods
  async getSessionAggregateStats(sessionId: string): Promise<{
    totalBots: number;
    completedBots: number;
    runningBots: number;
    failedBots: number;
    avgProfit: number;
    bestProfit: number;
    worstProfit: number;
  }> {
    return redisClient.getSessionAggregateStats(sessionId);
  }
  
  // Redis connection status
  isRedisConnected(): boolean {
    return redisClient.isReady();
  }
}

export const storage = new MemStorage();
