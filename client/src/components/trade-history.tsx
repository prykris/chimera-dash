import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trade } from "@shared/schema";

type TradeHistoryProps = {
  sessionId: string;
  configHash: string;
};

export default function TradeHistory({ sessionId, configHash }: TradeHistoryProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Fetch trades for this bot run
  const { data: trades, isLoading } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/bots/${configHash}/trades`],
  });
  
  // Apply pagination
  const paginatedTrades = trades 
    ? trades.slice((page - 1) * pageSize, page * pageSize)
    : [];
  
  const totalPages = trades ? Math.ceil(trades.length / pageSize) : 0;
  
  const formatDate = (timestamp: number) => {
    return format(timestamp, 'MMM d, HH:mm');
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Entry Time</TableHead>
            <TableHead>Exit Time</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Exit Price</TableHead>
            <TableHead>P&L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              </TableRow>
            ))
          ) : paginatedTrades && paginatedTrades.length > 0 ? (
            // Actual trades
            paginatedTrades.map((trade, index) => (
              <TableRow key={trade.id || index}>
                <TableCell>
                  <Badge variant="outline" className={
                    trade.type ? (
                      trade.type === 'LONG' 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    ) : (
                      trade.entrySize > 0 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    )
                  }>
                    {trade.type || (trade.entrySize > 0 ? 'LONG' : 'SHORT')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(trade.entryTimestamp)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(trade.exitTimestamp)}
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {trade.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {trade.exitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className={
                  trade.realizedPnl >= 0 
                  ? "text-sm text-emerald-600 font-medium" 
                  : "text-sm text-red-600 font-medium"
                }>
                  {trade.realizedPnl >= 0 ? '+' : ''}{trade.realizedPnl.toFixed(2)} USDT
                </TableCell>
              </TableRow>
            ))
          ) : (
            // No trades
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                No trades found for this bot run
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {!isLoading && trades && trades.length > pageSize && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * pageSize, trades.length)}
                </span>{" "}
                of <span className="font-medium">{trades.length}</span> trades
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  />
                </PaginationItem>
                
                {/* Show up to 5 page numbers */}
                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    // Calculate the page number to display
                    const pageNumber = page <= 3
                      ? i + 1
                      : page + i - 2;
                    
                    // Skip if page number is out of bounds
                    if (pageNumber > totalPages) return null;
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setPage(pageNumber)}
                          isActive={pageNumber === page}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
