import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  linkText?: string;
  linkHref?: string;
  isLoading?: boolean;
};

function StatCard({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  linkText,
  linkHref,
  isLoading = false,
}: StatCardProps) {
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn(
            "flex-shrink-0 rounded-md p-3",
            iconBgColor
          )}>
            <i className={cn(
              "fas",
              `fa-${icon}`,
              iconColor
            )}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{value}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {linkText && linkHref && (
        <CardFooter className="bg-gray-50 px-4 py-2 sm:px-6">
          <div className="text-sm">
            <Link href={linkHref}>
              <a className="font-medium text-primary-600 hover:text-primary-500">
                {linkText}
              </a>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default function StatisticsGrid() {
  // Fetch the statistics for the dashboard
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/sessions'],
  });
  
  // Calculate dashboard metrics
  const activeSessions = sessions?.filter(s => s.active).length || 0;
  const totalBotRuns = sessions?.reduce((acc, s) => acc + s.runCount, 0) || 0;
  const failedRuns = sessions?.reduce((acc, s) => acc + s.errorCount, 0) || 0;
  
  // Calculate success rate
  const completedRuns = sessions?.reduce((acc, s) => acc + s.completedRuns, 0) || 0;
  const successRate = totalBotRuns > 0 
    ? ((completedRuns / totalBotRuns) * 100).toFixed(1) 
    : "0.0";
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Active Sessions"
        value={activeSessions}
        icon="layer-group"
        iconColor="text-primary-600"
        iconBgColor="bg-primary-100"
        linkText="View all sessions"
        linkHref="/sessions"
        isLoading={sessionsLoading}
      />
      
      <StatCard
        title="Total Bot Runs"
        value={totalBotRuns.toLocaleString()}
        icon="robot"
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
        linkText="View all bots"
        linkHref="/sessions"
        isLoading={sessionsLoading}
      />
      
      <StatCard
        title="Failed Runs"
        value={failedRuns.toLocaleString()}
        icon="exclamation-triangle"
        iconColor="text-red-600"
        iconBgColor="bg-red-100"
        linkText="View errors"
        linkHref="/sessions"
        isLoading={sessionsLoading}
      />
      
      <StatCard
        title="Success Rate"
        value={`${successRate}%`}
        icon="chart-pie"
        iconColor="text-indigo-600"
        iconBgColor="bg-indigo-100"
        linkText="View details"
        linkHref="/sessions"
        isLoading={sessionsLoading}
      />
    </div>
  );
}
