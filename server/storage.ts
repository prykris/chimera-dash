import { BacktestRunRecord, InsertUser, SessionSummary, Trade, User } from '@shared/schema';
import { redisClient } from './lib/redis';

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
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getAllSessions(): Promise<SessionSummary[]> {
    try {
      return await redisClient.getAllSessions();
    } catch (error) {
      console.error('Error in getAllSessions:', error);
      return [];
    }
  }

  async getSession(sessionId: string): Promise<SessionSummary | null> {
    try {
      return await redisClient.getSession(sessionId);
    } catch (error) {
      console.error(`Error in getSession for ${sessionId}:`, error);
      return null;
    }
  }

  async getBotRun(sessionId: string, configHash: string): Promise<BacktestRunRecord | null> {
    try {
      return await redisClient.getBotRun(sessionId, configHash);
    } catch (error) {
      console.error(`Error in getBotRun for ${sessionId}:${configHash}:`, error);
      return null;
    }
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
    try {
      return await redisClient.getBotRunsForSession(sessionId, options);
    } catch (error) {
      console.error(`Error in getBotRunsForSession for ${sessionId}:`, error);
      return { bots: [], nextCursor: '0' };
    }
  }

  async getTradesForBotRun(sessionId: string, configHash: string): Promise<Trade[]> {
    try {
      return await redisClient.getTradesForBotRun(sessionId, configHash);
    } catch (error) {
      console.error(`Error in getTradesForBotRun for ${sessionId}:${configHash}:`, error);
      return [];
    }
  }

  async getSessionAggregateStats(sessionId: string): Promise<{
    totalBots: number;
    completedBots: number;
    runningBots: number;
    failedBots: number;
    avgProfit: number;
    bestProfit: number;
    worstProfit: number;
  }> {
    try {
      return await redisClient.getSessionAggregateStats(sessionId);
    } catch (error) {
      console.error(`Error in getSessionAggregateStats for ${sessionId}:`, error);
      return {
        totalBots: 0,
        completedBots: 0,
        runningBots: 0,
        failedBots: 0,
        avgProfit: 0,
        bestProfit: 0,
        worstProfit: 0
      };
    }
  }

  isRedisConnected(): boolean {
    return redisClient.isReady();
  }
}

export const storage = new MemStorage();