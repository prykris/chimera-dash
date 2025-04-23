import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  
  // Check if Redis is connected
  const { data: redisStatus } = useQuery({
    queryKey: ['/api/status/redis'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const isConnected = redisStatus?.connected || false;
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: "chart-line" },
    { name: "All Sessions", path: "/sessions", icon: "layer-group" },
    { name: "Bot Registry", path: "/registry", icon: "robot" },
    { name: "Settings", path: "/settings", icon: "cog" },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center h-16 px-4 border-b">
          <h1 className="text-xl font-semibold text-primary-900">Backtest Dashboard</h1>
          <button 
            className="text-gray-500 hover:text-gray-700" 
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        <div className="flex-1 px-2 py-4 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                onClick={onClose}
              >
                <a 
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    location === item.path
                      ? "text-white bg-primary-600" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <i className={cn(
                    "fas fa-" + item.icon,
                    "mr-3",
                    location === item.path ? "text-white" : "text-gray-400"
                  )}></i>
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Redis connection status */}
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 mr-2 rounded-full",
              isConnected ? "bg-green-400" : "bg-red-400"
            )}></div>
            <span className="text-sm font-medium text-gray-700">
              Redis {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <h1 className="text-xl font-semibold text-primary-900">Backtest Dashboard</h1>
          </div>
          <div className="flex flex-col flex-grow">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                >
                  <a 
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      location === item.path 
                        ? "text-white bg-primary-600" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <i className={cn(
                      "fas fa-" + item.icon,
                      "mr-3",
                      location === item.path 
                        ? "text-white" 
                        : "text-gray-400 group-hover:text-gray-500"
                    )}></i>
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Redis connection status */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className={cn(
                "w-2 h-2 mr-2 rounded-full",
                isConnected ? "bg-green-400" : "bg-red-400"
              )}></div>
              <span className="text-sm font-medium text-gray-700">
                Redis {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
