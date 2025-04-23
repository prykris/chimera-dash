import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatisticsGrid from "@/components/statistics-grid";
import RecentSessions from "@/components/recent-sessions";
import PerformanceCharts from "@/components/performance-charts";
import MarketOverview from "@/components/market-overview";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivitySquare, BarChart3, Home, LayoutDashboard, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Define response types
interface RedisStatusResponse {
  connected: boolean;
}

export default function Dashboard() {
  const [currentView, setCurrentView] = useState("overview");
  const { data: redisStatus } = useQuery<RedisStatusResponse>({
    queryKey: ['/api/status/redis'],
    refetchInterval: 10000, // Check Redis status every 10 seconds
  });
  
  const handleRefreshData = () => {
    // Invalidate all queries to refresh data
    window.location.reload();
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Badge 
              className={`ml-2 ${redisStatus?.connected ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}`}
            >
              Redis: {redisStatus?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Monitor trading bot performance and active backtesting sessions
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={handleRefreshData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={currentView} onValueChange={setCurrentView} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-8">
          {/* Dashboard Statistics */}
          <StatisticsGrid />
          
          {/* Market Overview */}
          <MarketOverview />
          
          {/* Recent Sessions Table */}
          <RecentSessions />
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          {/* Performance Charts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Analysis of bot performance metrics across all sessions
              </CardDescription>
            </CardHeader>
            <PerformanceCharts />
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4">
          <Card className="p-6 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent system activity and event log
              </CardDescription>
            </CardHeader>
            <p className="text-muted-foreground text-center py-12">
              Activity log feature coming soon
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
