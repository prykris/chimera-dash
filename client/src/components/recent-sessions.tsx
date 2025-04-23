import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionSummary } from "@shared/schema";
import { formatSessionId } from "@shared/schema";

function formatTimeRange(startTime: number, endTime: number): string {
  return `${format(startTime, 'MMM d, yyyy')} - ${format(endTime, 'MMM d, yyyy')}`;
}

function formatLastUpdate(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

export default function RecentSessions() {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
  // Fetch all sessions
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['/api/sessions'],
  });
  
  // Sort sessions by lastUpdate (most recent first) and slice for pagination
  const sortedSessions = sessions
    ? [...sessions].sort((a, b) => b.lastUpdate - a.lastUpdate)
    : [];
  
  const paginatedSessions = sortedSessions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  const totalPages = Math.ceil((sortedSessions.length || 0) / pageSize);
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 
              ? i + 1 
              : page + i - 2;
              
            if (pageNum > totalPages) return null;
            
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === page}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  const renderSessionStatus = (session: SessionSummary) => {
    if (session.active && session.currentStatus === 'running') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Running</Badge>;
    }
    
    if (session.active) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
    }
    
    if (session.errorCount > 0 && session.errorCount / session.runCount > 0.5) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
    }
    
    return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
  };
  
  const renderSessionRow = (session: SessionSummary) => {
    const sessionId = formatSessionId(
      session.symbol,
      session.timeframe,
      session.startTimestamp,
      session.endTimestamp
    );
    
    return (
      <TableRow 
        key={sessionId}
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => window.location.href = `/sessions/${sessionId}`}
      >
        <TableCell className="font-medium">
          {session.symbol} / {session.timeframe}
        </TableCell>
        <TableCell>
          {formatTimeRange(session.startTimestamp, session.endTimestamp)}
        </TableCell>
        <TableCell>{session.runCount.toLocaleString()}</TableCell>
        <TableCell className={session.bestProfit >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
          {session.bestProfit >= 0 ? '+' : ''}{session.bestProfit.toFixed(1)}%
        </TableCell>
        <TableCell>
          {renderSessionStatus(session)}
        </TableCell>
        <TableCell>
          {formatLastUpdate(session.lastUpdate)}
        </TableCell>
        <TableCell className="text-right">
          <Link href={`/sessions/${sessionId}`}>
            <a className="text-primary-600 hover:text-primary-900">View</a>
          </Link>
        </TableCell>
      </TableRow>
    );
  };
  
  const renderLoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
  
  return (
    <Card className="bg-white shadow rounded-lg mb-8">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Recent Backtest Sessions
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">
            {isLoading 
              ? "Loading sessions..." 
              : `Showing ${paginatedSessions.length} of ${sortedSessions.length} sessions`
            }
          </CardDescription>
        </div>
        <Button>
          New Session
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Symbol/Timeframe</TableHead>
              <TableHead>Time Range</TableHead>
              <TableHead>Run Count</TableHead>
              <TableHead>Best Profit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading 
              ? renderLoadingSkeleton() 
              : paginatedSessions.map(renderSessionRow)
            }
            
            {!isLoading && paginatedSessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                  No sessions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>
              {' '} to <span className="font-medium">
                {Math.min(page * pageSize, sortedSessions.length)}
              </span>
              {' '} of <span className="font-medium">{sortedSessions.length}</span> sessions
            </p>
          </div>
          {renderPagination()}
        </div>
      </CardFooter>
    </Card>
  );
}
