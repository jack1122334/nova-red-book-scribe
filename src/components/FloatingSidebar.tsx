
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Folder, User, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FloatingSidebarProps {
  currentPage: "home" | "creation" | "profile";
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
      icon: Folder,
      path: "/creation",
    },
    {
      id: "profile",
      label: "个人",
      icon: User,
      path: "/profile",
    },
  ];

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 hidden md:block">
      <div
        className={cn(
          "notion-floating transition-all duration-300 bg-white/45 rounded-3xl",
          isExpanded ? "w-48 p-4" : "w-14 p-3"
        )}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-3 transition-colors rounded-xl shadow-none hover:shadow-sm p-2"
        >
          {isExpanded ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full justify-start transition-all duration-200 font-serif text-sm rounded-xl p-2",
                currentPage === item.id
                  ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                  : "shadow-none hover:shadow-sm",
                !isExpanded && "justify-center"
              )}
            >
              <item.icon className="w-4 h-4" />
              {isExpanded && <span className="ml-3">{item.label}</span>}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
