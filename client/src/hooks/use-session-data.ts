import { useQuery } from "@tanstack/react-query";
import { SessionSummary } from "@shared/schema";

export function useSessionData(sessionId?: string) {
  // Fetch all sessions if sessionId is not provided
  const allSessionsQuery = useQuery<SessionSummary[]>({
    queryKey: ['/api/sessions'],
    enabled: !sessionId,
  });
  
  // Fetch specific session if sessionId is provided
  // NOTE: Keep the sessionId format as-is for API calls
  const sessionQuery = useQuery<SessionSummary>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });
  
  // Get session aggregate stats (total bots, completion stats, etc.)
  // NOTE: Keep the sessionId format as-is for API calls
  const sessionStatsQuery = useQuery({
    queryKey: [`/api/sessions/${sessionId}/bots/aggregate`],
    enabled: !!sessionId,
  });
  
  return {
    // All sessions data and loading state
    sessions: allSessionsQuery.data,
    isLoadingSessions: allSessionsQuery.isLoading,
    sessionsError: allSessionsQuery.error,
    
    // Single session data and loading state
    session: sessionQuery.data,
    isLoadingSession: sessionQuery.isLoading,
    sessionError: sessionQuery.error,
    
    // Session aggregate stats
    sessionStats: sessionStatsQuery.data,
    isLoadingStats: sessionStatsQuery.isLoading,
    statsError: sessionStatsQuery.error,
  };
}
