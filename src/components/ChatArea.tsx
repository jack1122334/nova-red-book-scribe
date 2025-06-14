
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Link, Edit3, Check, X } from "lucide-react";
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
  notifyCardUpdate: (cardId: string, content: string, title?: string) => void;
  notifyCardCreate: (cardId: string) => void;
}

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(
  ({ projectId, initialMessage, onCardCreated, onCardUpdated }, ref) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [references, setReferences] = useState<Reference[]>([]);
    const [editingRemark, setEditingRemark] = useState<number | null>(null);
    const [editRemarkText, setEditRemarkText] = useState("");
    const [pendingSystemMessages, setPendingSystemMessages] = useState<string[]>([]);
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
      },
      notifyCardUpdate: (cardId: string, content: string, title?: string) => {
        // 添加系统消息到待发送队列
        const systemMessage = `用户刚刚完成了对卡片"${title || cardId.slice(0, 8)}"(内部ID: ${cardId})的编辑。卡片的最新内容如下：\n---\n${content}\n---`;
        setPendingSystemMessages(prev => [...prev, systemMessage]);
        console.log('Card update notification added:', { cardId, title, content });
      },
      notifyCardCreate: (cardId: string) => {
        // 添加系统消息到待发送队列
        const systemMessage = `用户创建了一个新的空白卡片(内部ID: ${cardId})。`;
        setPendingSystemMessages(prev => [...prev, systemMessage]);
        console.log('Card create notification added:', { cardId });
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

    const startEditingRemark = (index: number, currentRemark: string) => {
      setEditingRemark(index);
      setEditRemarkText(currentRemark);
    };

    const saveRemark = (index: number) => {
      setReferences(prev => prev.map((ref, i) => 
        i === index ? { ...ref, user_remark: editRemarkText } : ref
      ));
      setEditingRemark(null);
      setEditRemarkText("");
    };

    const cancelEditRemark = () => {
      setEditingRemark(null);
      setEditRemarkText("");
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
        console.log('Pending system messages:', pendingSystemMessages);
        
        // 将待发送的系统消息包含在请求中
        const response = await chatApi.sendMessage(projectId, userMessage, references, pendingSystemMessages);
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
          
          // Clear references and pending system messages after successful message
          setReferences([]);
          setPendingSystemMessages([]);
          
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
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nova</h2>
          <p className="text-sm text-gray-600">小红书内容创作助手</p>
        </div>

        {/* System Messages Indicator */}
        {pendingSystemMessages.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <p className="text-xs text-blue-700">
              有 {pendingSystemMessages.length} 个编辑操作等待发送给AI
            </p>
          </div>
        )}

        {/* References Section */}
        {references.length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Link className="w-4 h-4" />
              引用内容 ({references.length})
            </h3>
            <div className="space-y-3">
              {references.map((ref, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 truncate">
                          {ref.card_friendly_title}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {ref.type === 'full_card' ? '整个卡片' : '文本片段'}
                        </span>
                      </div>
                      
                      {editingRemark === index ? (
                        <div className="space-y-2">
                          <Input
                            value={editRemarkText}
                            onChange={(e) => setEditRemarkText(e.target.value)}
                            placeholder="添加备注说明..."
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveRemark(index)}
                              className="h-7 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              保存
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditRemark}
                              className="h-7 text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-gray-600 text-xs flex-1">
                            {ref.user_remark || "暂无备注"}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingRemark(index, ref.user_remark)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      
                      {ref.snippet_content && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-blue-200">
                          "{ref.snippet_content.substring(0, 100)}..."
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReference(index)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">开始与 Nova 对话</h3>
              <p className="text-sm text-center max-w-md">
                我是您的小红书内容创作助手，可以帮您撰写、优化和完善各种类型的小红书笔记内容。
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  {message.role === 'assistant' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm">Nova 正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入消息..."
                className="min-h-[44px] max-h-[200px] resize-none border-gray-300 focus:border-gray-400 focus:ring-0"
                disabled={isLoading}
              />
              {(references.length > 0 || pendingSystemMessages.length > 0) && (
                <p className="text-xs text-gray-500 mt-2">
                  将发送 {references.length} 个引用{pendingSystemMessages.length > 0 && ` 和 ${pendingSystemMessages.length} 个编辑通知`} 给 AI
                </p>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-11 w-11 p-0 bg-black hover:bg-gray-800 disabled:bg-gray-300"
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
