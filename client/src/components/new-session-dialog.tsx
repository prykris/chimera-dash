import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema with validation
const newSessionSchema = z.object({
  exchange: z.string().min(1, "Exchange is required"),
  symbol: z.string().min(1, "Symbol is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date"
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date"
  }),
  candleLimit: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Candle limit must be a positive number"
  }),
  initialBalance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Initial balance must be a positive number"
  }),
  feePercentage: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 1, {
    message: "Fee percentage must be between 0 and 1"
  }),
  notes: z.string().optional(),
});

type NewSessionFormValues = z.infer<typeof newSessionSchema>;

export function NewSessionDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<NewSessionFormValues>({
    resolver: zodResolver(newSessionSchema),
    defaultValues: {
      exchange: "binance",
      symbol: "BTC/USD",
      timeframe: "1h",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      endDate: new Date().toISOString().split('T')[0], // Today
      candleLimit: "500",
      initialBalance: "10000",
      feePercentage: "0.001",
      notes: "",
    },
  });

  function onSubmit(values: NewSessionFormValues) {
    // Convert timestamps from date strings to Unix timestamps
    const startTimestamp = new Date(values.startDate).getTime();
    const endTimestamp = new Date(values.endDate).getTime();
    
    const sessionParams = {
      exchange: values.exchange,
      symbol: values.symbol,
      timeframe: values.timeframe,
      startTimestamp,
      endTimestamp,
      candleLimit: parseInt(values.candleLimit),
      initialBalance: parseFloat(values.initialBalance),
      feePercentage: parseFloat(values.feePercentage),
      notes: values.notes || '',
    };
    
    toast({
      title: "New session created",
      description: `Created ${values.symbol} session on ${values.exchange} with ${values.candleLimit} candles`,
    });
    
    // TODO: Implement actual API call to create the session
    console.log('Session parameters:', sessionParams);
    
    // Close the dialog
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Backtesting Session</DialogTitle>
          <DialogDescription>
            Configure a new algorithmic trading backtest session. This will create a new session
            with the specified parameters.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trading Pair</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trading pair" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                        <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                        <SelectItem value="SOL/USD">SOL/USD</SelectItem>
                        <SelectItem value="BNB/USD">BNB/USD</SelectItem>
                        <SelectItem value="XRP/USD">XRP/USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The trading pair for backtesting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeframe</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1m">1 minute</SelectItem>
                        <SelectItem value="5m">5 minutes</SelectItem>
                        <SelectItem value="15m">15 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="4h">4 hours</SelectItem>
                        <SelectItem value="1d">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The candlestick timeframe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Beginning of backtest period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      End of backtest period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="exchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="bybit">ByBit</SelectItem>
                        <SelectItem value="kucoin">KuCoin</SelectItem>
                        <SelectItem value="coinbase">Coinbase</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Exchange to fetch data from
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="candleLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candle Limit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="100" />
                    </FormControl>
                    <FormDescription>
                      Number of candles to fetch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Balance</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="1000" />
                    </FormControl>
                    <FormDescription>
                      Starting capital for backtests
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="feePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Percentage</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min="0" max="1" step="0.001" />
                  </FormControl>
                  <FormDescription>
                    Exchange fee percentage (e.g., 0.001 for 0.1%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Notes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional notes about this session" />
                  </FormControl>
                  <FormDescription>
                    Add notes or tags to help identify this session later
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}