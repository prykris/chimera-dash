import { useQuery } from "@tanstack/react-query";
import { BacktestRunRecord, Trade } from "@shared/schema";

type BotRunsOptions = {
  status?: string;
  minProfit?: number;
  maxProfit?: number;
  cursor?: string;
  limit?: number;
};

type BotRunsResult = {
  bots: Array<{
    configHash: string;
    status: string;
    profit: number;
    botId: string;
    lastUpdated: number;
  }>;
  nextCursor: string;
};

export function useBotData(
  sessionId: string,
  configHash?: string,
  options: BotRunsOptions = {}
) {
  // Fetch bot runs for a session with optional filters
  const botRunsQuery = useQuery<BotRunsResult>({
    queryKey: [
      `/api/sessions/${sessionId}/bots`,
      options
    ],
    enabled: !!sessionId && !configHash,
  });
  
  // Fetch details for a specific bot run
  const botRunQuery = useQuery<BacktestRunRecord>({
    queryKey: [`/api/sessions/${sessionId}/bots/${configHash}`],
    enabled: !!sessionId && !!configHash,
  });
  
  // Fetch trades for a specific bot run
  const tradesQuery = useQuery<Trade[]>({
    queryKey: [`/api/sessions/${sessionId}/bots/${configHash}/trades`],
    enabled: !!sessionId && !!configHash,
  });
  
  return {
    // Bot runs for session
    botRuns: botRunsQuery.data?.bots,
    nextCursor: botRunsQuery.data?.nextCursor,
    isLoadingBotRuns: botRunsQuery.isLoading,
    botRunsError: botRunsQuery.error,
    
    // Single bot run details
    botRun: botRunQuery.data,
    isLoadingBotRun: botRunQuery.isLoading,
    botRunError: botRunQuery.error,
    
    // Trades data
    trades: tradesQuery.data,
    isLoadingTrades: tradesQuery.isLoading,
    tradesError: tradesQuery.error,
  };
}
