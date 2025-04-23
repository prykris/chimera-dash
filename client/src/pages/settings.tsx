import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Database, ServerCog, Bell, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(false),
  emailAddress: z.string().email().optional().or(z.literal("")),
  pushNotifications: z.boolean().default(false),
  desktopNotifications: z.boolean().default(true),
});

export default function Settings() {
  const [activeTab, setActiveTab] = useState("connection");
  const { toast } = useToast();
  
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
  
  // Notifications form
  const notificationsForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: false,
      emailAddress: "",
      pushNotifications: false,
      desktopNotifications: true,
    },
  });
  
  function onRedisSubmit(values: z.infer<typeof redisFormSchema>) {
    toast({
      title: "Redis settings updated",
      description: "The Redis connection settings have been saved.",
    });
    console.log(values);
  }
  
  function onNotificationsSubmit(values: z.infer<typeof notificationFormSchema>) {
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
    console.log(values);
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
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
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
        
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form id="notifications-form" onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                  <FormField
                    control={notificationsForm.control}
                    name="desktopNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Desktop Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications in your browser
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email alerts for important events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {notificationsForm.watch("emailNotifications") && (
                    <FormField
                      control={notificationsForm.control}
                      name="emailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The email address where you want to receive notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={notificationsForm.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Push Notifications</FormLabel>
                          <FormDescription>
                            Receive push notifications on your devices
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline">Reset</Button>
              <Button type="submit" form="notifications-form">Save Changes</Button>
            </CardFooter>
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