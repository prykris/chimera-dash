import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type BotRunsTableProps = {
  sessionId: string;
  status?: string;
  minProfit?: number;
  maxProfit?: number;
};

export default function BotRunsTable({ 
  sessionId, 
  status, 
  minProfit, 
  maxProfit 
}: BotRunsTableProps) {
  const [cursor, setCursor] = useState("0");
  const limit = 10;
  
  // Fetch bot runs with filters
  const { data, isLoading, error } = useQuery({
    queryKey: [
      `/api/sessions/${sessionId}/bots`,
      { status, minProfit, maxProfit, cursor, limit }
    ],
  });
  
  const getBotStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const formatLastUpdated = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };
  
  const handlePrevPage = () => {
    if (cursor === "0") return;
    setCursor((parseInt(cursor) - limit).toString());
  };
  
  const handleNextPage = () => {
    if (!data || data.bots.length < limit) return;
    setCursor(data.nextCursor);
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Config Hash</TableHead>
            <TableHead>Bot ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Profit</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Render loading skeletons
            Array.from({ length: limit }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : data?.bots && data.bots.length > 0 ? (
            // Render bot runs
            data.bots.map((bot) => (
              <TableRow 
                key={bot.configHash}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <TableCell className="font-mono text-gray-500">
                  {bot.configHash.substring(0, 12)}
                </TableCell>
                <TableCell className="text-gray-900">{bot.botId}</TableCell>
                <TableCell>
                  {getBotStatusBadge(bot.status)}
                </TableCell>
                <TableCell className={bot.profit >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                  {bot.profit >= 0 ? '+' : ''}{bot.profit.toFixed(1)}%
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatLastUpdated(bot.lastUpdated)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  <Link href={`/sessions/${sessionId}/bots/${bot.configHash}`}>
                    <a className="text-primary-600 hover:text-primary-900">Details</a>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          ) : (
            // No results found
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                No bot runs found matching the criteria
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {!isLoading && data?.bots && data.bots.length > 0 && (
        <div className="flex items-center justify-between py-3 px-4 border-t">
          <div>
            <p className="text-sm text-gray-700">
              Showing {data.bots.length} results
            </p>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={handlePrevPage}
                  disabled={cursor === "0"}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={handleNextPage}
                  disabled={data.bots.length < limit}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
