import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
      </div>
    </div>
  );
}