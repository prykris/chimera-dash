import { createClient } from 'redis';
import { 
  SessionSummary,
  BacktestRunRecord,
  Trade,
  formatSessionId
} from '@shared/schema';

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private isConnected: boolean = false;

  constructor() {
    // Initialize Redis client
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      throw err;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  isReady() {
    return this.isConnected;
  }

  // Session keys are in format: bot_registry:session_current:{symbol}:{timeframe}:{startTimestamp}:{endTimestamp}
  async getSession(symbol: string, timeframe: string, startTimestamp: number, endTimestamp: number): Promise<SessionSummary | null> {
    const key = `bot_registry:session_current:${symbol}:${timeframe}:${startTimestamp}:${endTimestamp}`;
    const sessionData = await this.client.get(key);
    
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData) as SessionSummary;
    } catch (err) {
      console.error('Error parsing session data:', err);
      return null;
    }
  }

  async getAllSessions(): Promise<SessionSummary[]> {
    // Using SCAN to iterate through all session keys
    const keys = await this.scanKeys('bot_registry:session_current:*');
    
    if (keys.length === 0) return [];
    
    const sessions: SessionSummary[] = [];
    
    for (const key of keys) {
      const sessionData = await this.client.get(key);
      if (sessionData) {
        try {
          sessions.push(JSON.parse(sessionData) as SessionSummary);
        } catch (err) {
          console.error(`Error parsing session data for key ${key}:`, err);
        }
      }
    }
    
    return sessions;
  }

  // Bot run keys are in format: bot_registry:run:{symbol}:{timeframe}:{startTimestamp}:{endTimestamp}:{configHash}
  async getBotRun(
    symbol: string, 
    timeframe: string, 
    startTimestamp: number, 
    endTimestamp: number, 
    configHash: string
  ): Promise<BacktestRunRecord | null> {
    const key = `bot_registry:run:${symbol}:${timeframe}:${startTimestamp}:${endTimestamp}:${configHash}`;
    const botRunData = await this.client.get(key);
    
    if (!botRunData) return null;
    
    try {
      return JSON.parse(botRunData) as BacktestRunRecord;
    } catch (err) {
      console.error('Error parsing bot run data:', err);
      return null;
    }
  }

  // Get bot runs for a specific session, using indexes for filtering
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
    bots: Array<{ configHash: string; status: string; profit: number }>;
    nextCursor: string;
  }> {
    const { status, minProfit, maxProfit, cursor = '0', limit = 50 } = options;
    
    // Parse sessionId components
    const [symbol, timeframe, startTimestamp, endTimestamp] = sessionId.split(':');
    
    let configHashes: string[] = [];
    
    // Use the appropriate index based on filter criteria
    if (status) {
      // Get bots by status
      const statusKey = `session:${sessionId}:bots:status:${status}`;
      const scanResult = await this.client.sScan(statusKey, cursor, { COUNT: limit });
      configHashes = scanResult.members;
      
      // If we also have profit filters, we need to further filter the results
      if (minProfit !== undefined || maxProfit !== undefined) {
        // We'll need to get profit for each bot and filter manually
        const botsWithProfit = await Promise.all(
          configHashes.map(async (hash) => {
            const botRun = await this.getBotRun(
              symbol, timeframe, parseInt(startTimestamp), parseInt(endTimestamp), hash
            );
            return {
              configHash: hash,
              profit: botRun?.resultsMetadata.profit || 0,
              status: botRun?.status || 'unknown'
            };
          })
        );
        
        configHashes = botsWithProfit
          .filter(bot => {
            if (minProfit !== undefined && bot.profit < minProfit) return false;
            if (maxProfit !== undefined && bot.profit > maxProfit) return false;
            return true;
          })
          .map(bot => bot.configHash);
      }
    } else if (minProfit !== undefined || maxProfit !== undefined) {
      // Use the profit sorted set
      const min = minProfit !== undefined ? minProfit : '-inf';
      const max = maxProfit !== undefined ? maxProfit : '+inf';
      
      // Use ZRANGEBYSCORE to get bots within profit range
      configHashes = await this.client.zRangeByScore(`session:${sessionId}:bots:profit`, min, max, {
        LIMIT: {
          offset: parseInt(cursor) || 0,
          count: limit
        }
      });
    } else {
      // No filters, get all bots for this session
      const allBotsKey = `session:${sessionId}:bots`;
      const scanResult = await this.client.sScan(allBotsKey, cursor, { COUNT: limit });
      configHashes = scanResult.members;
    }
    
    // Get details for each bot
    const botDetails = await Promise.all(
      configHashes.map(async (hash) => {
        const botRun = await this.getBotRun(
          symbol, timeframe, parseInt(startTimestamp), parseInt(endTimestamp), hash
        );
        
        return {
          configHash: hash,
          status: botRun?.status || 'unknown',
          profit: botRun?.resultsMetadata.profit || 0,
          botId: botRun?.botId || '',
          lastUpdated: botRun?.lastUpdated || 0
        };
      })
    );
    
    // Handle cursor-based pagination
    const nextCursor = parseInt(cursor) + limit;
    
    return {
      bots: botDetails,
      nextCursor: nextCursor.toString()
    };
  }

  // Get trades for a specific bot run
  // Trades keys are in format: bot_registry:trades:{symbol}:{timeframe}:{startTimestamp}:{endTimestamp}:{configHash}
  async getTradesForBotRun(
    symbol: string, 
    timeframe: string, 
    startTimestamp: number, 
    endTimestamp: number, 
    configHash: string
  ): Promise<Trade[]> {
    const key = `bot_registry:trades:${symbol}:${timeframe}:${startTimestamp}:${endTimestamp}:${configHash}`;
    const tradesData = await this.client.get(key);
    
    if (!tradesData) return [];
    
    try {
      return JSON.parse(tradesData) as Trade[];
    } catch (err) {
      console.error('Error parsing trades data:', err);
      return [];
    }
  }

  // Get aggregate stats for a session
  async getSessionAggregateStats(sessionId: string): Promise<{
    totalBots: number;
    completedBots: number;
    runningBots: number;
    failedBots: number;
    avgProfit: number;
    bestProfit: number;
    worstProfit: number;
  }> {
    const [symbol, timeframe, startTimestampStr, endTimestampStr] = sessionId.split(':');
    const startTimestamp = parseInt(startTimestampStr);
    const endTimestamp = parseInt(endTimestampStr);
    
    // Get session data for best profit
    const session = await this.getSession(symbol, timeframe, startTimestamp, endTimestamp);
    
    // Get counts from status sets
    const completedCount = await this.client.sCard(`session:${sessionId}:bots:status:completed`);
    const runningCount = await this.client.sCard(`session:${sessionId}:bots:status:running`);
    const failedCount = await this.client.sCard(`session:${sessionId}:bots:status:failed`);
    
    // Get total count of bots
    const totalBots = await this.client.sCard(`session:${sessionId}:bots`);
    
    // For profit stats, we could use the sorted set
    const worstProfit = await this.client.zRange(`session:${sessionId}:bots:profit`, 0, 0, { REV: true });
    const worstConfigHash = worstProfit[0];
    let worstProfitValue = 0;
    
    if (worstConfigHash) {
      const worstBotRun = await this.getBotRun(
        symbol, timeframe, startTimestamp, endTimestamp, worstConfigHash
      );
      worstProfitValue = worstBotRun?.resultsMetadata.profit || 0;
    }
    
    return {
      totalBots: totalBots || 0,
      completedBots: completedCount || 0,
      runningBots: runningCount || 0,
      failedBots: failedCount || 0,
      avgProfit: session?.avgProfit || 0,
      bestProfit: session?.bestProfit || 0,
      worstProfit: worstProfitValue
    };
  }

  // Helper method to scan Redis keys with pattern matching
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== '0');
    
    return keys;
  }
}

// Export singleton instance
export const redisClient = new RedisClient();
