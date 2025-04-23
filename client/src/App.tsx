import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Sessions from "@/pages/sessions";
import SessionDetail from "@/pages/session-detail";
import BotDetail from "@/pages/bot-detail";
import Registry from "@/pages/registry";
import Settings from "@/pages/settings";
import AppLayout from "@/layouts/app-layout";

function Router() {
  return (
    <Switch>
      {/* Main routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/sessions/:symbol/:timeframeAndRange" component={SessionDetail} />
      <Route path="/sessions/:sessionId" component={SessionDetail} />
      <Route path="/sessions/:sessionId/bots/:configHash" component={BotDetail} />
      <Route path="/registry" component={Registry} />
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
