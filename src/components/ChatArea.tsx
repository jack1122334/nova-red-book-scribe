
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { chatApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  projectId: string;
  initialMessage?: string;
  onCardCreated: (cardId: string, title: string, content: string) => Promise<void>;
  onCardUpdated: (cardTitle: string, content: string) => Promise<void>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  llm_raw_output?: any;
  created_at: string;
}

export interface ChatAreaRef {
  // Add any methods you want to expose
}

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(
  ({ projectId, initialMessage, onCardCreated, onCardUpdated }, ref) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({}));

    useEffect(() => {
      loadMessages();
    }, [projectId]);

    useEffect(() => {
      if (initialMessage && !hasInitialized) {
        setInputValue(initialMessage);
        setHasInitialized(true);
      }
    }, [initialMessage, hasInitialized]);

    const loadMessages = async () => {
      try {
        const data = await chatApi.getMessages(projectId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    const parseXMLTags = (content: string) => {
      // Parse <new_xhs_card> tags
      const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
      let match;
      while ((match = newCardRegex.exec(content)) !== null) {
        const title = match[1] || `新卡片 ${Date.now()}`;
        const cardContent = match[2].trim();
        onCardCreated('temp-' + Date.now(), title, cardContent);
      }

      // Parse <update_xhs_card> tags
      const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
      while ((match = updateCardRegex.exec(content)) !== null) {
        const cardTitle = match[1];
        const cardContent = match[2].trim();
        onCardUpdated(cardTitle, cardContent);
      }

      // Return content with XML tags removed for display
      return content
        .replace(/<new_xhs_card(?:\s+title="[^"]*")?>[^]*?<\/new_xhs_card>/g, '[新卡片已创建]')
        .replace(/<update_xhs_card\s+card_ref_id="[^"]*">[^]*?<\/update_xhs_card>/g, '[卡片已更新]');
    };

    const handleSendMessage = async () => {
      if (!inputValue.trim() || isLoading) return;

      const userMessage = inputValue.trim();
      setInputValue("");
      setIsLoading(true);

      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: 'temp-user-' + Date.now(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      try {
        const response = await chatApi.sendMessage(projectId, userMessage, []);
        
        if (response?.content) {
          // Parse XML tags and trigger card operations
          const displayContent = parseXMLTags(response.content);
          
          // Add assistant message to UI
          const assistantMessage: ChatMessage = {
            id: 'temp-assistant-' + Date.now(),
            role: 'assistant',
            content: displayContent,
            llm_raw_output: response.content,
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev.slice(0, -1), tempUserMessage, assistantMessage]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        toast({
          title: "发送失败",
          description: "无法发送消息，请重试",
          variant: "destructive",
        });
        // Remove the temporary user message on error
        setMessages(prev => prev.slice(0, -1));
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

    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b bg-white/50">
          <h2 className="text-lg font-semibold text-gray-800">AI 助手</h2>
          <p className="text-sm text-gray-600">Nova 会帮你创作精彩的小红书内容</p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>开始与 Nova 对话</p>
              <p className="text-sm">告诉我你想要创作什么内容</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                
                <Card className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/70 backdrop-blur-sm'
                }`}>
                  <CardContent className="p-3">
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  </CardContent>
                </Card>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-600">Nova 正在思考...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white/50">
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="告诉 Nova 你想要创作什么内容..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ChatArea.displayName = "ChatArea";
