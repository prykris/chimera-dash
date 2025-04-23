import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronUp, ChevronDown, TrendingUp, Layers, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Mock market data for demo visualization
const generateMarketData = (days = 30, basePrice = 40000, volatility = 0.03) => {
  const data = [];
  let price = basePrice;
  
  for (let i = 0; i < days; i++) {
    // Generate random price movement with some trend
    const change = price * volatility * (Math.random() - 0.5);
    price += change;
    
    // Ensure price doesn't go below 0
    price = Math.max(price, 1000);
    
    // Add some trading volume
    const volume = Math.round(basePrice * 0.1 * (0.5 + Math.random()));
    
    data.push({
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
      price: Math.round(price),
      volume,
      change: change > 0 ? "+"+change.toFixed(2) : change.toFixed(2),
    });
  }
  
  return data;
};

export default function MarketOverview() {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading delay
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      // Generate new data for selected symbol
      const basePrice = selectedSymbol === "BTC/USD" ? 40000 : 
                       selectedSymbol === "ETH/USD" ? 2500 :
                       selectedSymbol === "SOL/USD" ? 100 : 500;
                       
      setMarketData(generateMarketData(30, basePrice));
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [selectedSymbol]);
  
  // Get current price and calculate change
  const currentPrice = marketData.length > 0 ? marketData[marketData.length - 1].price : 0;
  const previousPrice = marketData.length > 1 ? marketData[marketData.length - 2].price : 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  
  // Format to 2 decimal places with sign
  const formattedChange = priceChange >= 0 ? 
    `+${priceChange.toLocaleString()}` : 
    priceChange.toLocaleString();
    
  const formattedPercent = priceChangePercent >= 0 ? 
    `+${priceChangePercent.toFixed(2)}%` : 
    `${priceChangePercent.toFixed(2)}%`;
  
  const PriceChangeIndicator = () => (
    <div className={`flex items-center text-lg ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
      {priceChange >= 0 ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      <span className="font-semibold">{formattedPercent}</span>
      <span className="text-sm ml-1.5 text-muted-foreground">({formattedChange})</span>
    </div>
  );
  
  return (
    <Card className="mb-8 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Market Overview</CardTitle>
            <CardDescription>
              Historical price data and market analysis
            </CardDescription>
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                <SelectItem value="SOL/USD">SOL/USD</SelectItem>
                <SelectItem value="XRP/USD">XRP/USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="price" className="px-6">
        <TabsList className="mb-4">
          <TabsTrigger value="price" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Price</span>
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Volume</span>
          </TabsTrigger>
          <TabsTrigger value="depth" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Market Depth</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="price" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card className="bg-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Current Price
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    ${currentPrice.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  24h Change
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <PriceChangeIndicator />
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  30d Volume
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    ${marketData.reduce((sum, day) => sum + day.volume, 0).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-[280px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={marketData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    domain={['dataMin - 1000', 'dataMax + 1000']} 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    width={70}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    name="Price" 
                    stroke="#6366f1" 
                    fill="url(#colorPrice)" 
                    strokeWidth={2} 
                  />
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="volume" className="h-[400px] py-4">
          <div className="text-muted-foreground text-center h-full flex items-center justify-center">
            <p>Volume analysis coming soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="depth" className="h-[400px] py-4">
          <div className="text-muted-foreground text-center h-full flex items-center justify-center">
            <p>Market depth visualization coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardContent className="pt-0 pb-6 text-xs text-muted-foreground text-center">
        Note: Sample data is shown for illustrative purposes. Connect to Redis for live data.
      </CardContent>
    </Card>
  );
}