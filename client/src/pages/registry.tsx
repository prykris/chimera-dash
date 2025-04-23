import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Settings, Package2, GitFork } from "lucide-react";

export default function Registry() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Bot Registry</h1>
        <p className="text-muted-foreground">
          Manage and configure trading bots for backtesting
        </p>
      </div>

      <Tabs defaultValue="bots" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="bots" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>Bot Library</span>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex items-center gap-2">
            <GitFork className="h-4 w-4" />
            <span>Strategies</span>
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Parameters</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            <span>Packages</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bots" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Bots</CardTitle>
              <CardDescription>
                Trading bots ready for backtesting with various strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                This feature is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="strategies" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Strategies</CardTitle>
              <CardDescription>
                Configure and manage trading strategies for your bots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                This feature is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parameters" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Parameter Templates</CardTitle>
              <CardDescription>
                Create and manage parameter templates for faster configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                This feature is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="packages" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>External Packages</CardTitle>
              <CardDescription>
                Manage external packages and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                This feature is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}