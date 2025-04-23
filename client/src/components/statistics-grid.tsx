import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Layers, Bot, AlertTriangle, PieChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkText?: string;
  linkHref?: string;
  isLoading?: boolean;
  variant?: "default" | "success" | "danger" | "warning" | "info";
};

function StatCard({
  title,
  value,
  icon,
  linkText,
  linkHref,
  isLoading = false,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: {
      card: "border-primary/10",
      icon: "bg-primary/10 text-primary"
    },
    success: {
      card: "border-green-500/10",
      icon: "bg-green-500/10 text-green-500"
    },
    danger: {
      card: "border-red-500/10",
      icon: "bg-red-500/10 text-red-500"
    },
    warning: {
      card: "border-amber-500/10",
      icon: "bg-amber-500/10 text-amber-500"
    },
    info: {
      card: "border-blue-500/10",
      icon: "bg-blue-500/10 text-blue-500"
    }
  };

  return (
    <Card className={cn("shadow-sm hover:shadow transition-all duration-200", variantStyles[variant].card)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn(
            "flex-shrink-0 rounded-md p-3",
            variantStyles[variant].icon
          )}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
      {linkText && linkHref && (
        <CardFooter className="bg-muted/30 px-6 py-3 border-t">
          <Link href={linkHref}>
            <Button variant="link" className="p-0 h-auto font-medium text-primary flex items-center gap-1">
              {linkText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
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
        icon={<Layers size={24} />}
        linkText="View all sessions"
        linkHref="/sessions"
        isLoading={sessionsLoading}
        variant="default"
      />
      
      <StatCard
        title="Total Bot Runs"
        value={totalBotRuns.toLocaleString()}
        icon={<Bot size={24} />}
        linkText="View all bots"
        linkHref="/sessions"
        isLoading={sessionsLoading}
        variant="success"
      />
      
      <StatCard
        title="Failed Runs"
        value={failedRuns.toLocaleString()}
        icon={<AlertTriangle size={24} />}
        linkText="View errors"
        linkHref="/sessions"
        isLoading={sessionsLoading}
        variant="danger"
      />
      
      <StatCard
        title="Success Rate"
        value={`${successRate}%`}
        icon={<PieChart size={24} />}
        linkText="View details"
        linkHref="/sessions"
        isLoading={sessionsLoading}
        variant="info"
      />
    </div>
  );
}
