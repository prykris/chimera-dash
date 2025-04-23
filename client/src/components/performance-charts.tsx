import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import Chart from "chart.js/auto";

export default function PerformanceCharts() {
  const topBotsChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const topBotsChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);
  
  // Fetch data for all sessions to generate charts
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['/api/sessions'],
  });
  
  useEffect(() => {
    // Clean up charts on component unmount
    return () => {
      if (topBotsChartInstance.current) {
        topBotsChartInstance.current.destroy();
      }
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
    };
  }, []);
  
  useEffect(() => {
    if (!sessions || isLoading) return;
    
    // Process data for charts
    const processedSessions = sessions.sort((a, b) => b.bestProfit - a.bestProfit);
    
    // Get top 5 performing bots
    const topBots = processedSessions.slice(0, 5).map(session => ({
      name: `${session.symbol}:${session.timeframe}`,
      profit: session.bestProfit
    }));
    
    // Calculate status distribution
    const statusCounts = {
      completed: 0,
      running: 0,
      failed: 0
    };
    
    processedSessions.forEach(session => {
      if (session.currentStatus === 'running') {
        statusCounts.running++;
      } else if (session.errorCount > session.runCount / 2) {
        statusCounts.failed++;
      } else {
        statusCounts.completed++;
      }
    });
    
    // Render Top Bots chart
    if (topBotsChartRef.current) {
      if (topBotsChartInstance.current) {
        topBotsChartInstance.current.destroy();
      }
      
      const ctx = topBotsChartRef.current.getContext('2d');
      if (ctx) {
        topBotsChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: topBots.map(bot => bot.name),
            datasets: [{
              label: 'Profit %',
              data: topBots.map(bot => bot.profit),
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Profit (USDT)'
                }
              }
            }
          }
        });
      }
    }
    
    // Render Status chart
    if (statusChartRef.current) {
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
      
      const ctx = statusChartRef.current.getContext('2d');
      if (ctx) {
        statusChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Completed', 'Running', 'Failed'],
            datasets: [{
              data: [
                statusCounts.completed,
                statusCounts.running,
                statusCounts.failed
              ],
              backgroundColor: ['#10b981', '#eab308', '#ef4444'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
              }
            }
          }
        });
      }
    }
  }, [sessions, isLoading]);
  
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="bg-white shadow rounded-lg">
        <CardHeader className="px-4 py-5 sm:px-6">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Top Performing Bots
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">
            Based on profit value (USDT) across all sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <canvas ref={topBotsChartRef} height={300}></canvas>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow rounded-lg">
        <CardHeader className="px-4 py-5 sm:px-6">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Session Completion Status
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">
            Distribution of session statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <canvas ref={statusChartRef} height={300}></canvas>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
