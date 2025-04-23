import { createClient, RedisClientType } from 'redis';
import { BacktestRunRecord, SessionSummary, Trade, formatSessionKey, formatBotRunKey, formatTradesKey, formatSessionBotsSetKey, REDIS_KEYS } from '@shared/schema';

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private connecting: boolean = false;
  private connectionRetries: number = 0;
  private maxRetries: number = 1; // Only try once during startup

  constructor() {
    // For Replit environment we need to force localhost without protected mode
    const redisUrl = 'redis://localhost:6379';
    console.log(`Connecting to Redis at: ${redisUrl}`); // Show the connection URL

    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= this.maxRetries) {
            // Stop retrying after maxRetries
            this.connecting = false;
            return false;
          }
          this.connectionRetries = retries;
          return Math.min(retries * 100, 3000); // Time between retries
        }
      }
    });

    this.client.on('error', (err) => {
      if (this.connecting) {
        console.error('Redis Client Error:', err);
      } else {
        // Just log a single line when not actively connecting
        console.debug('Redis connection unavailable');
      }
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
      this.connecting = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting');
      this.isConnected = false;
    });
  }

  async connect() {
    try {
      if (this.connecting || this.isConnected) {
        return this.isConnected;
      }

      this.connecting = true;
      console.log('Attempting to connect to Redis...');
      await this.client.connect();
      this.connecting = false;
      this.isConnected = true;
      return true;
    } catch (error) {
      this.connecting = false;
      this.isConnected = false;
      console.error('Failed to connect to Redis:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      this.isConnected = false;
      return true;
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
      return false;
    }
  }

  isReady() {
    return this.isConnected;
  }

  // Session methods
  async getSession(sessionId: string): Promise<SessionSummary | null> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const key = formatSessionKey(sessionId);
      console.log("Redis sessionkey:", key);
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as SessionSummary;
    } catch (error) {
      console.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  async getAllSessions(): Promise<SessionSummary[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      const sessionKeys = await this.scanKeys(`${REDIS_KEYS.SESSION}:*`);
      const sessions: SessionSummary[] = [];

      for (const key of sessionKeys) {
        const data = await this.client.get(key);
        if (data) {
          sessions.push(JSON.parse(data) as SessionSummary);
        }
      }

      return sessions;
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  // Bot run methods
  async getBotRun(sessionId: string, configHash: string): Promise<BacktestRunRecord | null> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const key = formatBotRunKey(sessionId, configHash);
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as BacktestRunRecord;
    } catch (error) {
      console.error(`Error getting bot run ${sessionId}:${configHash}:`, error);
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
      if (!this.isConnected) {
        return { bots: [], nextCursor: '0' };
      }

      const { status, minProfit, maxProfit, cursor = '0', limit = 50 } = options;
      // Use SCAN to find all config keys for this session
      const pattern = `${formatSessionBotsSetKey(sessionId)}:*`;
      let scanCursor = Number(cursor);
      let keys: string[] = [];
      let nextCursor = '0';
      // Only scan once per call for pagination
      const result = await this.client.scan(scanCursor, { MATCH: pattern, COUNT: limit });
      nextCursor = String(result.cursor);
      keys = result.keys;

      const bots = [];
      for (const key of keys) {
        // Extract configHash from key
        const parts = key.split(":");
        const configHash = parts[parts.length - 1];
        const data = await this.client.get(key);
        if (data) {
          const botRun = JSON.parse(data) as BacktestRunRecord;
          const profit = botRun.resultsMetadata?.performance?.profit ?? 0;
          if (status && botRun.status !== status) continue;
          if ((minProfit !== undefined && profit < minProfit) || (maxProfit !== undefined && profit > maxProfit)) continue;
          bots.push({
            configHash,
            status: botRun.status,
            profit,
            botId: botRun.botId,
            lastUpdated: botRun.lastUpdated
          });
        }
      }
      return { bots, nextCursor };
    } catch (error) {
      console.error(`Error getting bot runs for session ${sessionId}:`, error);
      return { bots: [], nextCursor: '0' };
    }
  }

  // Trade methods
  async getTradesForBotRun(sessionId: string, configHash: string): Promise<Trade[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      const key = formatTradesKey(sessionId, configHash);
      const data = await this.client.get(key);

      if (!data) {
        return [];
      }

      return JSON.parse(data) as Trade[];
    } catch (error) {
      console.error(`Error getting trades for bot run ${sessionId}:${configHash}:`, error);
      return [];
    }
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
    try {
      if (!this.isConnected) {
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

      const setKey = formatSessionBotsSetKey(sessionId) + ':*';
      const configHashes = await this.client.sMembers(setKey);

      if (configHashes.length === 0) {
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

      let totalBots = 0;
      let completedBots = 0;
      let runningBots = 0;
      let failedBots = 0;
      let totalProfit = 0;
      let bestProfit = -Infinity;
      let worstProfit = Infinity;

      for (const configHash of configHashes) {
        const botRunKey = formatBotRunKey(sessionId, configHash);
        const data = await this.client.get(botRunKey);

        if (data) {
          const botRun = JSON.parse(data) as BacktestRunRecord;
          totalBots++;

          if (botRun.status === 'completed') {
            completedBots++;
          } else if (botRun.status === 'running') {
            runningBots++;
          } else if (botRun.status === 'failed') {
            failedBots++;
          }

          const profit = botRun.resultsMetadata?.performance?.profit ?? 0;
          totalProfit += profit;

          if (profit > bestProfit) {
            bestProfit = profit;
          }

          if (profit < worstProfit) {
            worstProfit = profit;
          }
        }
      }

      const avgProfit = totalBots > 0 ? totalProfit / totalBots : 0;

      return {
        totalBots,
        completedBots,
        runningBots,
        failedBots,
        avgProfit,
        bestProfit: bestProfit === -Infinity ? 0 : bestProfit,
        worstProfit: worstProfit === Infinity ? 0 : worstProfit
      };
    } catch (error) {
      console.error(`Error getting aggregate stats for session ${sessionId}:`, error);
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

  // Helper methods
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];

    try {
      if (!this.isConnected) {
        return keys;
      }

      let cursorStr = '0';

      do {
        // Use the correct type signature for scan in node-redis
        const result = await this.client.scan(Number(cursorStr), {
          MATCH: pattern,
          COUNT: 100
        });
        cursorStr = String(result.cursor);
        keys.push(...result.keys);
      } while (cursorStr !== '0');
    } catch (error) {
      console.error(`Error scanning keys with pattern ${pattern}:`, error);
    }

    return keys;
  }
}

export const redisClient = new RedisClient();