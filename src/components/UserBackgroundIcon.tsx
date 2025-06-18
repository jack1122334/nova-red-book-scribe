
import React from "react";
import { User, BookOpen, Palette } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface UserBackgroundIconProps {
  userBackground: any;
}

export const UserBackgroundIcon = ({ userBackground }: UserBackgroundIconProps) => {
  if (!userBackground) return null;

  const renderBackgroundContent = () => {
    const items = [];
    
    if (userBackground.personalities) {
      items.push({
        type: "个性特质",
        icon: User,
        content: userBackground.personalities.content
      });
    }
    
    if (userBackground.intentions) {
      items.push({
        type: "写作意图",
        icon: BookOpen,
        content: userBackground.intentions.content
      });
    }

    if (userBackground.accountStyles) {
      items.push({
        type: "账号风格",
        icon: Palette,
        content: userBackground.accountStyles.content
      });
    }

    return items;
  };

  const backgroundItems = renderBackgroundContent();

  if (backgroundItems.length === 0) return null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="p-2 bg-black/10 rounded-xl cursor-pointer hover:bg-black/20 transition-colors">
          <User className="w-5 h-5 text-black" />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="right">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-stone-900">用户背景信息</h4>
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
    </HoverCard>
  );
};
