
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Lightbulb, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { chatApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  rawOutput?: string;
  messageType?: "normal" | "thinking" | "system";
}

interface ChatAreaProps {
  projectId: string;
  initialMessage?: string;
  onCardCreated?: (cardId: string, title: string, content: string) => void;
  onCardUpdated?: (cardTitle: string, content: string) => void;
}

export const ChatArea = ({ projectId, initialMessage, onCardCreated, onCardUpdated }: ChatAreaProps) => {
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
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 500);
    }
  }, [initialMessage]);

  const parseAgentOutput = (rawOutput: string) => {
    const results = {
      newCards: [] as Array<{title?: string, content: string}>,
      updatedCards: [] as Array<{cardTitle: string, content: string}>,
      messages: [] as string[],
      plainText: rawOutput
    };

    // 解析 <new_xhs_card> 标签
    const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([\s\S]*?)<\/new_xhs_card>/g;
    let match;
    while ((match = newCardRegex.exec(rawOutput)) !== null) {
      results.newCards.push({
        title: match[1] || undefined,
        content: match[2].trim()
      });
    }

    // 解析 <update_xhs_card> 标签
    const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)">([\s\S]*?)<\/update_xhs_card>/g;
    while ((match = updateCardRegex.exec(rawOutput)) !== null) {
      results.updatedCards.push({
        cardTitle: match[1],
        content: match[2].trim()
      });
    }

    // 移除所有XML标签，得到纯文本
    results.plainText = rawOutput
      .replace(/<new_xhs_card(?:\s+title="[^"]*")?>([\s\S]*?)<\/new_xhs_card>/g, '')
      .replace(/<update_xhs_card\s+card_ref_id="[^"]*">([\s\S]*?)<\/update_xhs_card>/g, '')
      .trim();

    return results;
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue;
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageContent) {
      setInputValue("");
    }
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(projectId, {
        core_instruction: content,
        references: [], // TODO: 将来从引用篮构建
      });

      // 解析AI响应
      const parsed = parseAgentOutput(response.content);

      // 处理新卡片创建
      for (const newCard of parsed.newCards) {
        const title = newCard.title || `AI草稿 ${Date.now()}`;
        onCardCreated?.(Date.now().toString(), title, newCard.content);
        
        const systemMessage: Message = {
          id: Date.now().toString() + Math.random(),
          role: "system",
          content: `AI 创建了新卡片："${title}"`,
          timestamp: new Date().toISOString(),
          messageType: "system"
        };
        setMessages(prev => [...prev, systemMessage]);
      }

      // 处理卡片更新
      for (const updatedCard of parsed.updatedCards) {
        onCardUpdated?.(updatedCard.cardTitle, updatedCard.content);
        
        const systemMessage: Message = {
          id: Date.now().toString() + Math.random(),
          role: "system",
          content: `AI 更新了卡片："${updatedCard.cardTitle}"`,
          timestamp: new Date().toISOString(),
          messageType: "system"
        };
        setMessages(prev => [...prev, systemMessage]);
      }

      // 添加AI的回复消息
      if (parsed.plainText) {
        const agentMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: parsed.plainText,
          timestamp: new Date().toISOString(),
          rawOutput: response.content
        };
        setMessages(prev => [...prev, agentMessage]);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "发送失败",
        description: "无法发送消息，请重试",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: "抱歉，消息发送失败，请重试。",
        timestamp: new Date().toISOString(),
        messageType: "system"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
            onClick={() => handleSendMessage()}
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
