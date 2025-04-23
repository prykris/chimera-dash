import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title?: string;
  onMenuClick: () => void;
};

export default function Header({ title = "Dashboard", onMenuClick }: HeaderProps) {
  return (
    <div className="relative z-10 flex h-16 flex-shrink-0 bg-white shadow">
      {/* Mobile menu button */}
      <button 
        type="button" 
        className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <i className="fas fa-bars"></i>
      </button>
      
      <div className="flex flex-1 justify-between px-4">
        {/* Search bar */}
        <div className="flex flex-1">
          <div className="flex w-full md:ml-0">
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4" />
              </div>
              <Input
                id="search-field"
                className="block h-full w-full border-transparent pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                placeholder="Search sessions or bots"
                type="search"
              />
            </div>
          </div>
        </div>
        
        {/* User menu */}
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-1 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
          </Button>

          {/* Profile dropdown */}
          <div className="relative ml-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="sr-only">Open user menu</span>
                  <Avatar className="h-8 w-8 bg-primary-700">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
