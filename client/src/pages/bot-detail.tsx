import { useParams, Link } from "wouter";
import { useBotData } from "@/hooks/use-bot-data";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EquityCurve from "@/components/equity-curve";
import TradeHistory from "@/components/trade-history";
import { Clipboard, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function BotDetail() {
  const { sessionId, configHash } = useParams<{ sessionId: string, configHash: string }>();
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  if (!sessionId || !configHash) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Invalid parameters</h2>
        <p className="mt-2 text-gray-500">Please provide a valid session ID and config hash</p>
      </div>
    );
  }
  
  const { botRun, isLoadingBotRun, trades, isLoadingTrades } = useBotData(sessionId, configHash);
  
  const getBotStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };
  
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return format(timestamp, 'MMMM d, yyyy \'at\' HH:mm');
  };
  
  const handleCopyConfig = () => {
    if (!botRun) return;
    
    navigator.clipboard.writeText(JSON.stringify(botRun.configuration, null, 2))
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Configuration copied",
          description: "Bot configuration has been copied to clipboard",
        });
        
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the configuration to clipboard",
          variant: "destructive"
        });
      });
  };
  
  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isLoadingBotRun ? (
              <Skeleton className="h-8 w-96" />
            ) : (
              <>Bot Run: {botRun?.botId} ({configHash.substring(0, 12)})</>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            <span 
              className="text-primary-600 hover:text-primary-800 cursor-pointer"
              onClick={() => window.location.href = `/sessions/${sessionId}`}
            >
              Back to session
            </span>
          </p>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-50 p-4 rounded-lg">
          <CardContent className="p-0">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1 flex items-center">
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                getBotStatusBadge(botRun?.status)
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 p-4 rounded-lg">
          <CardContent className="p-0">
            <h3 className="text-sm font-medium text-gray-500">Profit</h3>
            {isLoadingBotRun ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <p className={`mt-1 text-lg font-semibold ${
                (botRun?.resultsMetadata.profit || 0) >= 0 
                  ? 'text-emerald-600' 
                  : 'text-red-600'
              }`}>
                {(botRun?.resultsMetadata.profit || 0) >= 0 ? '+' : ''}
                {botRun?.resultsMetadata.profit.toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 p-4 rounded-lg">
          <CardContent className="p-0">
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            {isLoadingBotRun ? (
              <Skeleton className="h-5 w-36 mt-1" />
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {formatTimestamp(botRun?.lastUpdated)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics */}
      <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Total Trades</dt>
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-12 mt-1" />
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {botRun?.resultsMetadata.trades || 0}
                </dd>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Win Rate</dt>
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-16 mt-1" />
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {botRun?.resultsMetadata.winRate || 0}%
                </dd>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Profit Factor</dt>
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-12 mt-1" />
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {botRun?.resultsMetadata.profitFactor?.toFixed(1) || '-'}
                </dd>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Max Drawdown</dt>
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-14 mt-1" />
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {botRun?.resultsMetadata.maxDrawdown?.toFixed(1) || '-'}%
                </dd>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Avg Trade Duration</dt>
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-20 mt-1" />
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {botRun?.resultsMetadata.avgTradeDuration || '-'}
                </dd>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Sharpe Ratio</dt>
              {isLoadingBotRun ? (
                <Skeleton className="h-5 w-12 mt-1" />
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {botRun?.resultsMetadata.sharpeRatio?.toFixed(1) || '-'}
                </dd>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Equity Curve Chart */}
      <EquityCurve sessionId={sessionId} configHash={configHash} />
      
      {/* Bot Configuration */}
      <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Bot Configuration
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCopyConfig}>
            {isCopied ? (
              <>
                <Check className="mr-1 h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Clipboard className="mr-1 h-4 w-4" /> Copy Config
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {isLoadingBotRun ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-800">
              {JSON.stringify(botRun?.configuration, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
      
      {/* Trade History */}
      <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Trade History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TradeHistory sessionId={sessionId} configHash={configHash} />
        </CardContent>
      </Card>
    </>
  );
}
