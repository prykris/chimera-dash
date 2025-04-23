import React from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useLocation } from "wouter";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [location] = useLocation();

  // Get current page title based on location
  const getPageTitle = () => {
    if (location === "/") return "Dashboard Overview";
    if (location === "/sessions") return "All Sessions";
    if (location.startsWith("/sessions/") && !location.includes("/bots/")) return "Session Details";
    if (location.includes("/bots/")) return "Bot Run Details";
    return "Backtest Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header 
          title={getPageTitle()}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
