import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Database, ServerCog, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define response types
interface RedisStatusResponse {
  connected: boolean;
}

interface RedisConfigResponse {
  success: boolean;
  connected: boolean;
  message: string;
}

const redisFormSchema = z.object({
  host: z.string().min(1, {
    message: "Redis host cannot be empty",
  }),
  port: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 65535, {
    message: "Port must be a valid number between 1-65535",
  }),
  password: z.string().optional(),
  database: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Database must be a valid number starting from 0",
  }),
});

export default function Settings() {
  const [activeTab, setActiveTab] = useState("connection");
  const { toast } = useToast();
  const [configSuccess, setConfigSuccess] = useState<boolean | null>(null);
  const [configMessage, setConfigMessage] = useState<string>("");
  
  // Fetch current Redis connection status
  const { data: redisStatus } = useQuery<RedisStatusResponse>({
    queryKey: ['/api/status/redis'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Redis connection mutation
  const redisMutation = useMutation({
    mutationFn: async (data: z.infer<typeof redisFormSchema>) => {
      return apiRequest('/api/config/redis', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Redis connected successfully" : "Redis connection failed",
        description: data.message || (data.success ? "The Redis connection settings have been saved." : "Failed to connect to Redis with the provided settings."),
        variant: data.success ? "default" : "destructive"
      });
      
      setConfigSuccess(data.success);
      setConfigMessage(data.message || "");
      
      // Invalidate Redis status query to refresh the status
      queryClient.invalidateQueries({ queryKey: ['/api/status/redis'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update Redis settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      
      setConfigSuccess(false);
      setConfigMessage(error instanceof Error ? error.message : "An unknown error occurred");
    }
  });
  
  // Redis connection form
  const redisForm = useForm<z.infer<typeof redisFormSchema>>({
    resolver: zodResolver(redisFormSchema),
    defaultValues: {
      host: "127.0.0.1",
      port: "6379",
      password: "",
      database: "0",
    },
  });
  
  function onRedisSubmit(values: z.infer<typeof redisFormSchema>) {
    // Reset status indicators
    setConfigSuccess(null);
    setConfigMessage("");
    
    // Submit the form data
    redisMutation.mutate(values);
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Connection</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <ServerCog className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Redis Connection</CardTitle>
              <CardDescription>
                Configure the connection to your Redis database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Redis Connection Status */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Connection Status:</h3>
                    <Badge 
                      className={redisStatus?.connected ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}
                    >
                      {redisStatus?.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {redisStatus?.connected 
                        ? "Redis server is currently available" 
                        : "Redis server is currently unavailable"
                      }
                    </span>
                  </div>
                </div>
                
                {/* Configuration Result Alert */}
                {configSuccess !== null && (
                  <Alert variant={configSuccess ? "default" : "destructive"} className="mt-2">
                    {configSuccess ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>{configSuccess ? "Connection Successful" : "Connection Failed"}</AlertTitle>
                    <AlertDescription>
                      {configMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <Form {...redisForm}>
                <form id="redis-form" onSubmit={redisForm.handleSubmit(onRedisSubmit)} className="space-y-4">
                  <FormField
                    control={redisForm.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host</FormLabel>
                        <FormControl>
                          <Input placeholder="localhost or IP address" {...field} />
                        </FormControl>
                        <FormDescription>
                          The hostname or IP address of your Redis server
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={redisForm.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input placeholder="6379" {...field} />
                        </FormControl>
                        <FormDescription>
                          The port your Redis server is running on (default: 6379)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={redisForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional password" type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Redis server password (if authentication is enabled)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={redisForm.control}
                    name="database"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Redis database number (default: 0)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline">Cancel</Button>
              <Button type="submit" form="redis-form">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system preferences and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-muted-foreground text-center py-8">
                This feature is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
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