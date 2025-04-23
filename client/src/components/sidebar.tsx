import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Layers, 
  Bot, 
  Settings, 
  X, 
  AlertCircle,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  
  // Check if Redis is connected
  const { data: redisStatus } = useQuery<{ connected: boolean }>({
    queryKey: ['/api/status/redis'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const isConnected = redisStatus?.connected || false;
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { name: "All Sessions", path: "/sessions", icon: <Layers size={18} /> },
    { name: "Bot Registry", path: "/registry", icon: <Bot size={18} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-card shadow-lg transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center h-16 px-4 border-b">
          <h1 className="text-xl font-semibold text-foreground">Backtest Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="sr-only">Close sidebar</span>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <div key={item.path}>
                  <Button 
                    variant={location === item.path ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      location === item.path ? "" : "text-muted-foreground"
                    )}
                    onClick={() => {
                      window.location.href = item.path;
                      onClose();
                    }}
                  >
                    <span className="mr-3">
                      {item.icon}
                    </span>
                    {item.name}
                  </Button>
                </div>
              ))}
            </nav>
          </div>
        </ScrollArea>
        
        {/* Redis connection status */}
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className={cn(
              "mr-2",
              isConnected ? "text-green-500" : "text-red-500"
            )}>
              <Database size={16} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Redis {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <h1 className="text-xl font-semibold text-foreground">Backtest Dashboard</h1>
          </div>
          <ScrollArea className="flex-grow">
            <div className="px-2 pb-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <div key={item.path}>
                    <Button 
                      variant={location === item.path ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        location === item.path ? "" : "text-muted-foreground"
                      )}
                      onClick={() => {
                        window.location.href = item.path;
                      }}
                    >
                      <span className="mr-3">
                        {item.icon}
                      </span>
                      {item.name}
                    </Button>
                  </div>
                ))}
              </nav>
            </div>
          </ScrollArea>
          
          {/* Redis connection status */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className={cn(
                "mr-2",
                isConnected ? "text-green-500" : "text-red-500"
              )}>
                <Database size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Redis {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
