import { useState } from "react";
import StatisticsGrid from "@/components/statistics-grid";
import RecentSessions from "@/components/recent-sessions";
import PerformanceCharts from "@/components/performance-charts";

export default function Dashboard() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Monitoring active backtesting sessions and bot performance</p>
      </div>
      
      {/* Dashboard Statistics */}
      <StatisticsGrid />
      
      {/* Recent Sessions Table */}
      <RecentSessions />
      
      {/* Performance Charts */}
      <PerformanceCharts />
    </>
  );
}
