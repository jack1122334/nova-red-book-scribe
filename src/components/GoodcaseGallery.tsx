
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const goodcases = [
  {
    id: 1,
    title: "春季护肤的艺术",
    content: "季节更替之际，肌肤需要细致入微的呵护。这不仅是一种仪式，更是对自己的温柔对待...",
    category: "护肤美妆",
    engagement: { likes: 1234, comments: 89, shares: 45 },
    color: "from-rose-50 to-pink-50",
  },
  {
    id: 2,
    title: "慢食哲学与生活美学",
    content: "在快节奏的都市生活中，重新发现食物的本真味道，每一口都是对生活的深度体验...",
    category: "生活方式",
    engagement: { likes: 2156, comments: 134, shares: 78 },
    color: "from-green-50 to-emerald-50",
  },
  {
    id: 3,
    title: "极简主义的穿衣哲学",
    content: "真正的优雅来自于简约，每一件衣物都应该是经过深思熟虑的选择...",
    category: "时尚搭配",
    engagement: { likes: 3421, comments: 201, shares: 156 },
    color: "from-gray-50 to-slate-50",
  },
  {
    id: 4,
    title: "居所的诗意表达",
    content: "家不仅是居住的空间，更是心灵的港湾。每一个角落都应该承载着生活的温度...",
    category: "家居生活",
    engagement: { likes: 987, comments: 67, shares: 34 },
    color: "from-blue-50 to-indigo-50",
  },
];

export const GoodcaseGallery = () => {
  return (
    <div>
      <h2 className="text-3xl font-sans font-medium text-gray-900 mb-3 tracking-tight">
        精选创作
      </h2>
      <p className="text-gray-600 mb-12 text-lg">
        从这些优秀的创作案例中汲取灵感
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goodcases.map((goodcase, index) => (
          <Card
            key={goodcase.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg border-gray-200 bg-white animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-0">
              <div className={`h-24 bg-gradient-to-br ${goodcase.color} border-b border-gray-100 flex items-end justify-start p-6`}>
                <Badge 
                  variant="secondary" 
                  className="bg-white/90 text-gray-700 font-sans text-xs font-medium border-0"
                >
                  {goodcase.category}
                </Badge>
              </div>
              
              <div className="p-6">
                <h3 className="font-sans font-medium text-gray-900 mb-3 text-lg leading-tight group-hover:text-gray-700 transition-colors">
                  {goodcase.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  {goodcase.content}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 font-sans">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{goodcase.engagement.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{goodcase.engagement.comments}</span>
                  </div>
                  <div className="flex items-center space-x-1">
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
