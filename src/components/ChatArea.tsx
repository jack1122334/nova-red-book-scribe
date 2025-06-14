import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Link } from "lucide-react";
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

interface Reference {
  type: 'full_card' | 'text_snippet';
  card_id: string;
  card_friendly_title: string;
  user_remark: string;
  snippet_content?: string;
}

export interface ChatAreaRef {
  addReference: (reference: Reference) => void;
  clearReferences: () => void;
}

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(
  ({ projectId, initialMessage, onCardCreated, onCardUpdated }, ref) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [references, setReferences] = useState<Reference[]>([]);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
      addReference: (reference: Reference) => {
        setReferences(prev => [...prev, reference]);
        toast({
          title: "引用已添加",
          description: `已添加对卡片"${reference.card_friendly_title}"的引用`,
        });
      },
      clearReferences: () => {
        setReferences([]);
      }
    }));

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
        console.log('Loading messages for project:', projectId);
        const data = await chatApi.getMessages(projectId);
        console.log('Loaded messages:', data);
        
        // Convert database messages to frontend ChatMessage format
        const formattedMessages: ChatMessage[] = data.map(msg => ({
          id: msg.id,
          role: (msg.role as 'user' | 'assistant' | 'system') || 'user',
          content: msg.content,
          llm_raw_output: msg.llm_raw_output,
          created_at: msg.created_at,
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: "加载消息失败",
          description: "无法加载历史消息",
          variant: "destructive",
        });
      }
    };

    const parseXMLTags = (content: string) => {
      // Parse <new_xhs_card> tags
      const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
      let match;
      while ((match = newCardRegex.exec(content)) !== null) {
        const title = match[1] || `新卡片 ${Date.now()}`;
        const cardContent = match[2].trim();
        console.log('Creating new card:', { title, cardContent });
        onCardCreated('temp-' + Date.now(), title, cardContent);
      }

      // Parse <update_xhs_card> tags
      const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
      while ((match = updateCardRegex.exec(content)) !== null) {
        const cardTitle = match[1];
        const cardContent = match[2].trim();
        console.log('Updating card:', { cardTitle, cardContent });
        onCardUpdated(cardTitle, cardContent);
      }

      // Return content with XML tags removed for display
      return content
        .replace(/<new_xhs_card(?:\s+title="[^"]*")?>[^]*?<\/new_xhs_card>/g, '[新卡片已创建]')
        .replace(/<update_xhs_card\s+card_ref_id="[^"]*">[^]*?<\/update_xhs_card>/g, '[卡片已更新]');
    };

    const removeReference = (index: number) => {
      setReferences(prev => prev.filter((_, i) => i !== index));
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
        console.log('Sending message with references:', references);
        const response = await chatApi.sendMessage(projectId, userMessage, references);
        console.log('Chat API response:', response);
        
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
          
          // Clear references after successful message
          setReferences([]);
          
          toast({
            title: "消息发送成功",
            description: "AI 已回复您的消息",
          });
        }
      } catch (error: any) {
        console.error('Failed to send message:', error);
        toast({
          title: "发送失败",
          description: error.message || "无法发送消息，请重试",
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

        {/* References Section */}
        {references.length > 0 && (
          <div className="p-4 border-b bg-yellow-50/50">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Link className="w-4 h-4" />
              引用内容 ({references.length})
            </h3>
            <div className="space-y-2">
              {references.map((ref, index) => (
                <div key={index} className="bg-white/70 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-medium text-purple-700">
                        {ref.card_friendly_title}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({ref.type === 'full_card' ? '整个卡片' : '文本片段'})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReference(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                  {ref.user_remark && (
                    <p className="text-gray-600 mt-1">备注：{ref.user_remark}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
          {references.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              将发送 {references.length} 个引用内容给 AI
            </p>
          )}
        </div>
      </div>
    );
  }
);

ChatArea.displayName = "ChatArea";
