
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Lightbulb, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  rawOutput?: string; // 存储Agent的原始输出（含XML标签）
  messageType?: "normal" | "thinking" | "system";
}

interface ChatAreaProps {
  projectId: string;
  initialMessage?: string;
}

export const ChatArea = ({ projectId, initialMessage }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "你好！我是 Nova，专门帮助你创作小红书内容的 AI 助手。你可以告诉我你想要创作什么样的内容，我会为你生成草稿或者帮你优化现有的内容。",
      timestamp: new Date().toISOString(),
    },
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理来自首页的初始消息
  useEffect(() => {
    if (initialMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      // 自动发送初始消息给Agent
      setTimeout(() => {
        handleAgentResponse(initialMessage);
      }, 500);
    }
  }, [initialMessage]);

  // 解析Agent的XML标签输出
  const parseAgentOutput = (rawOutput: string) => {
    const results = {
      artifacts: [] as Array<{cardId?: string, content: string}>,
      thoughts: [] as string[],
      messages: [] as string[],
      plainText: rawOutput
    };

    // 解析 <artifact> 标签
    const artifactRegex = /<artifact(?:\s+card_id="([^"]*)")?>([\s\S]*?)<\/artifact>/g;
    let match;
    while ((match = artifactRegex.exec(rawOutput)) !== null) {
      results.artifacts.push({
        cardId: match[1] || undefined,
        content: match[2].trim()
      });
    }

    // 解析 <think> 标签
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    while ((match = thinkRegex.exec(rawOutput)) !== null) {
      results.thoughts.push(match[1].trim());
    }

    // 解析 <message> 标签
    const messageRegex = /<message>([\s\S]*?)<\/message>/g;
    while ((match = messageRegex.exec(rawOutput)) !== null) {
      results.messages.push(match[1].trim());
    }

    // 移除所有XML标签，得到纯文本
    results.plainText = rawOutput
      .replace(/<artifact(?:\s+card_id="[^"]*")?>([\s\S]*?)<\/artifact>/g, '')
      .replace(/<think>([\s\S]*?)<\/think>/g, '')
      .replace(/<message>([\s\S]*?)<\/message>/g, '')
      .trim();

    return results;
  };

  // 处理Agent响应
  const handleAgentResponse = async (userInput: string) => {
    setIsLoading(true);

    // 模拟Agent的响应（包含XML标签）
    const mockAgentResponse = `<think>
    用户想要创作关于春季护肤的小红书内容。我需要创建一个新的卡片，内容要活泼有趣，符合小红书的风格。
    </think>

    <message>
    我来为你创作一篇关于春季护肤的小红书内容！让我生成一个新的草稿。
    </message>

    <artifact>
    🌸春季护肤必备清单🌸

    小仙女们！春天来了，肌肤换季也要跟上节奏哦～

    ✨ 温和清洁是关键
    换季时肌肤特别敏感，选择温和的氨基酸洁面，告别紧绷感！

    💧 补水保湿加倍
    春季风大干燥，保湿精华+乳液双重保障，水润一整天！

    🌿 防晒永远不能少
    春季紫外线已经很强了，SPF30+防晒霜必须安排上！

    🌱 适度去角质
    一周1-2次温和去角质，让后续护肤品更好吸收～

    记住：护肤路上没有捷径，坚持才是王道！✨

    #春季护肤 #护肤心得 #美妆分享 #护肤日记
    </artifact>`;

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 解析Agent输出
    const parsed = parseAgentOutput(mockAgentResponse);

    // 添加思考过程消息
    if (parsed.thoughts.length > 0) {
      parsed.thoughts.forEach(thought => {
        const thinkMessage: Message = {
          id: Date.now().toString() + Math.random(),
          role: "assistant",
          content: thought,
          timestamp: new Date().toISOString(),
          messageType: "thinking"
        };
        setMessages(prev => [...prev, thinkMessage]);
      });
    }

    // 添加Agent的回复消息
    if (parsed.messages.length > 0) {
      parsed.messages.forEach(msg => {
        const agentMessage: Message = {
          id: Date.now().toString() + Math.random(),
          role: "assistant",
          content: msg,
          timestamp: new Date().toISOString(),
          rawOutput: mockAgentResponse
        };
        setMessages(prev => [...prev, agentMessage]);
      });
    }

    // 处理artifacts - 创建或更新卡片
    if (parsed.artifacts.length > 0) {
      parsed.artifacts.forEach(artifact => {
        // 这里应该调用WritingArea的方法来创建或更新卡片
        // 由于组件间通信的限制，这里先用console.log模拟
        console.log('Creating/updating card:', artifact);
        
        // 添加系统消息到聊天记录
        const systemMessage: Message = {
          id: Date.now().toString() + Math.random(),
          role: "system",
          content: artifact.cardId 
            ? `Agent 更新了卡片 ${artifact.cardId}` 
            : `Agent 创建了新卡片`,
          timestamp: new Date().toISOString(),
          messageType: "system"
        };
        setMessages(prev => [...prev, systemMessage]);
      });
    }

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    await handleAgentResponse(currentInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 添加系统消息的方法（供WritingArea调用）
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content,
      timestamp: new Date().toISOString(),
      messageType: "system"
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  // 暴露方法给父组件
  (ChatArea as any).addSystemMessage = addSystemMessage;

  const getMessageIcon = (message: Message) => {
    if (message.messageType === "thinking") {
      return <Brain className="w-5 h-5 text-blue-600" />;
    }
    switch (message.role) {
      case "assistant":
        return <Bot className="w-5 h-5 text-purple-600" />;
      case "system":
        return <Lightbulb className="w-5 h-5 text-orange-500" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMessageStyle = (message: Message) => {
    if (message.messageType === "thinking") {
      return "bg-blue-50 border-blue-200";
    }
    switch (message.role) {
      case "assistant":
        return "bg-purple-50 border-purple-200";
      case "system":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white/50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Bot className="w-5 h-5 mr-2 text-purple-600" />
          Nova 对话
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`${getMessageStyle(message)} border shadow-sm`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message)}
                </div>
                <div className="flex-1">
                  {message.messageType === "thinking" && (
                    <div className="text-xs text-blue-600 font-medium mb-2">
                      💭 Nova 正在思考...
                    </div>
                  )}
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {isLoading && (
          <Card className="bg-purple-50 border-purple-200 border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                  <span className="text-sm text-gray-600">Nova 正在思考...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white/50">
        <div className="flex gap-2">
          <Input
            placeholder="告诉 Nova 你想要创作什么..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-purple-200 focus:border-purple-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
