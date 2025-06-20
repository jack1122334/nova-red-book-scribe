import React from "react";
import { User, BookOpen, Package } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { UserBackgroundData } from "@/types/userBackground";

interface UserBackgroundIconProps {
  userBackground: UserBackgroundData | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  noHover?: boolean;
}

export const UserBackgroundIcon = ({ userBackground, size = 'md', noHover = false }: UserBackgroundIconProps) => {
  // Add debugging
  console.log('UserBackgroundIcon - userBackground:', userBackground);
  
  if (!userBackground) {
    console.log('UserBackgroundIcon - No userBackground data, not rendering');
    return null;
  }

  const renderBackgroundContent = () => {
    const items = [];
    
    if (userBackground.personalities) {
      items.push({
        type: "人设定位",
        icon: User,
        content: userBackground.personalities.content
      });
    }
    
    if (userBackground.resources) {
      items.push({
        type: "账号资源",
        icon: Package,
        content: userBackground.resources.content
      });
    }

    if (userBackground.intentions) {
      items.push({
        type: "写作目的",
        icon: BookOpen,
        content: userBackground.intentions.content
      });
    }

    console.log('UserBackgroundIcon - background items:', items);
    return items;
  };

  const backgroundItems = renderBackgroundContent();

  if (backgroundItems.length === 0) {
    console.log('UserBackgroundIcon - No background items, not rendering');
    return null;
  }

  console.log('UserBackgroundIcon - Rendering with', backgroundItems.length, 'items');

  // Define size classes
  const sizeClasses = {
    sm: 'p-2 w-5 h-5',
    md: 'p-2 w-6 h-6', 
    lg: 'p-3 w-7 h-7'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={`flex justify-center items-center !p-0 bg-black/10  rounded-xl cursor-pointer hover:bg-black/20 transition-colors ${sizeClasses[size]}`}
        >
          <User className={`text-black text-[12px]`} />
        </div>
      </HoverCardTrigger>
      {!noHover && (
        <HoverCardContent className="w-80" side="right">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-stone-900">
              用户背景信息
            </h4>
            <div className="space-y-3">
              {backgroundItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-1.5 bg-stone-100 rounded-lg flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-stone-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-700 mb-1">
                        {item.type}
                      </p>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};
