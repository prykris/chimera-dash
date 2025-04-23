import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Chart from "chart.js/auto";
import { Trade } from "@shared/schema";

type EquityCurveProps = {
  sessionId: string;
  configHash: string;
};

export default function EquityCurve({ sessionId, configHash }: EquityCurveProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Fetch trades for this bot run
  const { data: trades, isLoading } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/bots/${configHash}/trades`],
  });
  
  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);
  
  // Build and render the equity curve when trades data changes
  useEffect(() => {
    if (!trades || isLoading || !chartRef.current) return;
    
    // Clean up previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Sort trades by entry time
    const sortedTrades = [...trades].sort((a, b) => a.entryTime - b.entryTime);
    
    // Calculate running equity for each trade
    const equity = [100]; // Start with 100% equity
    
    sortedTrades.forEach(trade => {
      const lastEquity = equity[equity.length - 1];
      const newEquity = lastEquity * (1 + trade.profitLoss / 100);
      equity.push(newEquity);
    });
    
    // Create labels (trade numbers)
    const labels = Array.from({ length: equity.length }, (_, i) => i);
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Equity',
            data: equity,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  
                  if (index === 0) {
                    return `Starting equity: 100%`;
                  }
                  
                  const trade = sortedTrades[index - 1];
                  const pl = trade.profitLoss >= 0 ? `+${trade.profitLoss.toFixed(2)}%` : `${trade.profitLoss.toFixed(2)}%`;
                  
                  return [
                    `Trade #${index}`,
                    `Type: ${trade.type}`,
                    `P&L: ${pl}`,
                    `Current Equity: ${context.parsed.y.toFixed(2)}%`
                  ];
                }
              }
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'Equity %'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Trade Number'
              }
            }
          }
        }
      });
    }
  }, [trades, isLoading]);
  
  return (
    <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Equity Curve
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <canvas ref={chartRef} height={250}></canvas>
        )}
      </CardContent>
    </Card>
  );
}
