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
import { NewSessionDialog } from "@/components/new-session-dialog";
import { Clock, ArrowUpDown, Activity, CheckCircle2, AlertTriangle, XCircle, PlusCircle } from "lucide-react";

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
  const { data: sessions, isLoading, error } = useQuery<SessionSummary[]>({
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <span className="sr-only">Go to previous page</span>
              <ArrowUpDown className="h-4 w-4 rotate-90" />
            </Button>
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 
              ? i + 1 
              : page + i - 2;
              
            if (pageNum > totalPages) return null;
            
            return (
              <PaginationItem key={pageNum}>
                <Button
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="h-8 w-8"
                >
                  {pageNum}
                </Button>
              </PaginationItem>
            );
          })}
          
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <span className="sr-only">Go to next page</span>
              <ArrowUpDown className="h-4 w-4 -rotate-90" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  const renderSessionStatus = (session: SessionSummary) => {
    if (session.active && session.currentStatus === 'running') {
      return (
        <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-700 flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span>Running</span>
        </Badge>
      );
    }
    
    if (session.active) {
      return (
        <Badge variant="outline" className="bg-green-100 border-green-200 text-green-700 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Active</span>
        </Badge>
      );
    }
    
    if (session.errorCount > 0 && session.errorCount / session.runCount > 0.5) {
      return (
        <Badge variant="outline" className="bg-red-100 border-red-200 text-red-700 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-700 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        <span>Completed</span>
      </Badge>
    );
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary"
            onClick={() => {
              window.location.href = `/sessions/${sessionId}`;
            }}
          >
            View
          </Button>
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
    <Card className="mb-8 shadow-sm">
      <CardHeader className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <CardTitle className="text-xl font-semibold">
            Recent Backtest Sessions
          </CardTitle>
          <CardDescription>
            {isLoading 
              ? "Loading sessions..." 
              : `Showing ${paginatedSessions.length} of ${sortedSessions.length} sessions`
            }
          </CardDescription>
        </div>
        <NewSessionDialog />
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol/Timeframe</TableHead>
              <TableHead className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Time Range</span>
              </TableHead>
              <TableHead>Run Count</TableHead>
              <TableHead className="flex items-center gap-1">
                <ArrowUpDown className="h-4 w-4" />
                <span>Best Profit</span>
              </TableHead>
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
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No sessions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <CardFooter className="border-t bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm text-muted-foreground">
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
