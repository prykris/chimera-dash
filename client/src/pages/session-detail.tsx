import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useSessionData } from "@/hooks/use-session-data";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import BotFilter from "@/components/bot-filter";
import BotRunsTable from "@/components/bot-runs-table";
import { formatSessionId, parseSessionId } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function SessionDetail() {
  // Get sessionId parameter from the URL
  const params = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Keep sessionId as is - don't replace underscores with slashes
  // This ensures API calls are made with the correct format
  const sessionId = params.sessionId;
  
  // Set up filters state for bot runs
  const [filters, setFilters] = useState<{
    status?: string;
    minProfit?: number;
    maxProfit?: number;
  }>({});
  
  // Fetch session data
  const { session, isLoadingSession, sessionStats, isLoadingStats } = useSessionData(sessionId);
  
  if (!sessionId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Session ID not provided</h2>
        <p className="mt-2 text-gray-500">Please select a valid session</p>
      </div>
    );
  }
  
  // Parse session ID components for display - replace underscores with slashes for parsing
  const sessionComponents = parseSessionId(sessionId.replace(/_/g, '/'));
  
  const formatTimeRange = (startTime: number, endTime: number): string => {
    return `${format(startTime, 'MMM d, yyyy')} - ${format(endTime, 'MMM d, yyyy')}`;
  };
  
  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Session: {session?.symbol} / {session?.timeframe}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoadingSession ? (
              <Skeleton className="h-5 w-64" />
            ) : (
              formatTimeRange(session?.startTimestamp || 0, session?.endTimestamp || 0)
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/sessions"}>
          Back to Sessions
        </Button>
      </div>
      
      {/* Session Info Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-50 p-4 rounded-lg">
          <CardContent className="p-0">
            <h3 className="text-sm font-medium text-gray-500">Time Range</h3>
            {isLoadingSession ? (
              <Skeleton className="h-6 w-40 mt-1" />
            ) : (
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatTimeRange(session?.startTimestamp || 0, session?.endTimestamp || 0)}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 p-4 rounded-lg">
          <CardContent className="p-0">
            <h3 className="text-sm font-medium text-gray-500">Total Bot Runs</h3>
            {isLoadingSession ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {session?.runCount.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 p-4 rounded-lg">
          <CardContent className="p-0">
            <h3 className="text-sm font-medium text-gray-500">Best Performance</h3>
            {isLoadingSession ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <p className={`mt-1 text-lg font-semibold ${session?.bestProfit && session.bestProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {session?.bestProfit && session.bestProfit >= 0 ? '+' : ''}
                {session?.bestProfit?.toFixed(2)} USDT
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bot Runs Filter */}
      <BotFilter onFilterChange={setFilters} />
      
      {/* Bot Runs Table */}
      <Card className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Bot Runs
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">
            {isLoadingSession ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              `Showing results from ${session?.runCount || 0} runs`
            )}
          </CardDescription>
        </CardHeader>
        
        <BotRunsTable 
          sessionId={sessionId}
          status={filters.status}
          minProfit={filters.minProfit}
          maxProfit={filters.maxProfit}
        />
      </Card>
      
      {/* Performance Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        {/* Add performance charts here if needed */}
      </div>
    </>
  );
}
