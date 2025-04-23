import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type BotFilterProps = {
  onFilterChange: (filters: {
    status?: string;
    minProfit?: number;
    maxProfit?: number;
  }) => void;
};

export default function BotFilter({ onFilterChange }: BotFilterProps) {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [minProfit, setMinProfit] = useState<string>("");
  const [maxProfit, setMaxProfit] = useState<string>("");
  
  const handleApplyFilters = () => {
    onFilterChange({
      status,
      minProfit: minProfit !== "" ? parseFloat(minProfit) : undefined,
      maxProfit: maxProfit !== "" ? parseFloat(maxProfit) : undefined,
    });
  };
  
  const handleResetFilters = () => {
    setStatus(undefined);
    setMinProfit("");
    setMaxProfit("");
    onFilterChange({});
  };
  
  return (
    <Card className="mb-6 bg-white border border-gray-200 rounded-lg">
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">
          Filter Bot Runs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
              Status
            </Label>
            <Select 
              value={status} 
              onValueChange={setStatus}
            >
              <SelectTrigger id="statusFilter" className="mt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="minProfit" className="block text-sm font-medium text-gray-700">
              Min Profit
            </Label>
            <Input 
              type="number" 
              id="minProfit" 
              value={minProfit}
              onChange={(e) => setMinProfit(e.target.value)}
              className="mt-1"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="maxProfit" className="block text-sm font-medium text-gray-700">
              Max Profit
            </Label>
            <Input 
              type="number" 
              id="maxProfit" 
              value={maxProfit}
              onChange={(e) => setMaxProfit(e.target.value)}
              className="mt-1"
              placeholder="100"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button 
              className="flex-1" 
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
