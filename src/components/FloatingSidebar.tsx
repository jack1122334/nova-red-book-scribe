
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Edit3, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FloatingSidebarProps {
  currentPage: "home" | "creation";
}

export const FloatingSidebar = ({ currentPage }: FloatingSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "home",
      label: "首页",
      icon: Home,
      path: "/",
    },
    {
      id: "creation",
      label: "创作台",
      icon: Edit3,
      path: "/creation",
    },
  ];

  return (
    <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-50">
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-sm shadow-lg transition-all duration-300",
          isExpanded ? "w-48 p-4" : "w-12 p-2"
        )}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-2 hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full justify-start transition-all duration-200 font-sans text-sm",
                currentPage === item.id
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "hover:bg-gray-100 text-gray-700",
                !isExpanded && "px-2"
              )}
            >
              <item.icon className="w-4 h-4" />
              {isExpanded && <span className="ml-2">{item.label}</span>}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
