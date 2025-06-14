
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const goodcases = [
  {
    id: 1,
    title: "春季护肤攻略",
    content: "姐妹们！春天来了，换季护肤一定要注意这几点...",
    category: "护肤",
    engagement: { likes: 1234, comments: 89, shares: 45 },
    gradient: "from-pink-200 to-rose-200",
  },
  {
    id: 2,
    title: "减脂餐搭配指南",
    content: "低卡又好吃的减脂餐来啦！这样搭配营养均衡...",
    category: "美食",
    engagement: { likes: 2156, comments: 134, shares: 78 },
    gradient: "from-green-200 to-emerald-200",
  },
  {
    id: 3,
    title: "穿搭显瘦小技巧",
    content: "矮个子女生必看！这样穿搭瞬间高10cm...",
    category: "穿搭",
    engagement: { likes: 3421, comments: 201, shares: 156 },
    gradient: "from-purple-200 to-violet-200",
  },
  {
    id: 4,
    title: "居家收纳神器",
    content: "这些收纳好物真的太好用了！小空间秒变整洁...",
    category: "生活",
    engagement: { likes: 987, comments: 67, shares: 34 },
    gradient: "from-blue-200 to-cyan-200",
  },
];

export const GoodcaseGallery = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-8">精选创作案例</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {goodcases.map((goodcase) => (
          <Card
            key={goodcase.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-white/70 backdrop-blur-sm border-0"
          >
            <CardContent className="p-0">
              <div className={`h-32 bg-gradient-to-br ${goodcase.gradient} rounded-t-lg flex items-center justify-center`}>
                <Badge variant="secondary" className="bg-white/80">
                  {goodcase.category}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                  {goodcase.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {goodcase.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>{goodcase.engagement.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{goodcase.engagement.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    <span>{goodcase.engagement.shares}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
