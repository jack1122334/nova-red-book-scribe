import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Link, Edit3, Check, X, Info } from "lucide-react";
import { chatApi, bluechatApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageDetailsDialog } from "@/components/MessageDetailsDialog";
import { ReferenceDisplay } from "@/components/ReferenceDisplay";
import { CanvasItem } from "@/stores/canvasStore";
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from "@/stores/authStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { CanvasReferenceDisplay } from "@/components/CanvasReferenceDisplay";
import { useProjectStore } from "@/stores/projectStore";
import { useCardsStore } from "@/stores/cardsStore";

interface ChatAreaProps {
  projectId: string;
  initialMessage?: string;
  onCardCreated: (cardId: string, title: string, content: string) => Promise<void>;
  onCardUpdated: (cardTitle: string, content: string) => Promise<void>;
  onCanvasDataReceived?: (data: Record<string, unknown>) => void;
  writingAreaRef?: React.RefObject<{ switchToXiaohongshuTab: () => void }>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  llm_raw_output?: Record<string, unknown> | null;
  created_at: string;
}

interface DifyToolCall {
  id?: string;
  tool: string;
  tool_input: string;
  tool_labels: { [key: string]: { zh_Hans: string; en_US: string } };
  observation?: string;
  position?: number;
}

interface StreamingMessage extends ChatMessage {
  thoughts?: string[];
  toolCalls?: DifyToolCall[];
  isStreaming?: boolean;
}

interface StreamingEvent {
  event: string;
  id?: string;
  thought?: string;
  answer?: string;
  tool?: string;
  tool_input?: string;
  tool_labels?: Record<string, { zh_Hans: string; en_US: string }>;
  observation?: string;
  position?: number;
  conversation_id?: string;
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

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(({
  projectId,
  initialMessage,
  onCardCreated,
  onCardUpdated,
  onCanvasDataReceived,
  writingAreaRef
}, ref) => {
  const { user } = useAuthStore();
  const { currentProject } = useProjectStore();
  const {
    canvasItems,
    insights,
    canvasReferences,
    saveCanvasData,
    saveInsightsData,
  } = useCanvasStore();

  const {
    xiaohongshuCards,
    saveXiaohongshuData,
    processStreamData: processCardsStreamData,
  } = useCardsStore();

  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [editingRemark, setEditingRemark] = useState<number | null>(null);
  const [editRemarkText, setEditRemarkText] = useState("");
  const [pendingSystemMessages, setPendingSystemMessages] = useState<string[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<StreamingMessage | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    addReference: (reference: Reference) => {
      setReferences(prev => [...prev, reference]);
      toast({
        title: "引用已添加",
        description: `已添加对卡片"${reference.card_friendly_title}"的引用`
      });
    },
    clearReferences: () => {
      setReferences([]);
    },
    notifyCardUpdate: (cardId: string, content: string, title?: string) => {
      const systemMessage = `用户刚刚完成了对卡片"${title || cardId.slice(0, 8)}"(内部ID: ${cardId})的编辑。卡片的最新内容如下：\n---\n${content}\n---`;
      setPendingSystemMessages(prev => [...prev, systemMessage]);
      console.log('Card update notification added:', { cardId, title, content });
    },
    notifyCardCreate: (cardId: string) => {
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

      const formattedMessages: StreamingMessage[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system' || 'user',
        content: msg.content,
        llm_raw_output: msg.llm_raw_output,
        created_at: msg.created_at
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "加载消息失败",
        description: "无法加载历史消息",
        variant: "destructive"
      });
    }
  };

  const parseXMLTags = (content: string) => {
    const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
    let match;
    while ((match = newCardRegex.exec(content)) !== null) {
      const title = match[1] || `新卡片 ${Date.now()}`;
      const cardContent = match[2].trim();
      console.log('Creating new card:', { title, cardContent });
      onCardCreated('temp-' + Date.now(), title, cardContent);
    }

    const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
    while ((match = updateCardRegex.exec(content)) !== null) {
      const cardTitle = match[1];
      const cardContent = match[2].trim();
      console.log('Updating card:', { cardTitle, cardContent });
      onCardUpdated(cardTitle, cardContent);
    }

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
    setReferences(prev => prev.map((ref, i) => i === index ? {
      ...ref,
      user_remark: editRemarkText
    } : ref));
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

    const tempUserMessage: StreamingMessage = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Create streaming assistant message
    const tempAssistantMessage: StreamingMessage = {
      id: 'temp-assistant-' + Date.now(),
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true
    };
    setMessages(prev => [...prev, tempAssistantMessage]);

    let finalAssistantContent = '';
    const canvasDataToSave: Record<string, unknown>[] = [];
    const insightsDataToSave: Record<string, unknown>[] = [];
    const cardsDataToSave: Record<string, unknown>[] = [];

    try {
      console.log("ChatArea: Sending message to bluechat");

      // 1. 先保存用户消息到数据库
      const savedUserMessage = await chatApi.saveMessage(
        projectId,
        "user",
        userMessage
      );
      console.log("ChatArea: User message saved:", savedUserMessage.id);

      // Update temp user message with real ID
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempUserMessage.id
            ? { ...msg, id: savedUserMessage.id }
            : msg
        )
      );

      // Determine stage based on selected items
      let stage: "STAGE_1" | "STAGE_2" | "STAGE_3" = "STAGE_1";
      if (canvasItems.length > 0 && insights.length > 0) {
        stage = "STAGE_3";
      } else if (canvasItems.length > 0) {
        stage = "STAGE_2";
      } else {
        stage = "STAGE_1";
      }

      const selectedIds = canvasReferences.map((item) => item.external_id);

      const userBackground = `
        intentions:${currentProject.user_background.intentions.content} 
        --
        resources:${currentProject.user_background.resources.content} 
        --
        personalities:${currentProject.user_background.personalities.content}
        `;

      await bluechatApi.sendMessageStream(
        projectId,
        userMessage,
        stage,
        selectedIds,
        user?.id || "anonymous",
        userBackground,
        async (data: Record<string, unknown>) => {
          console.log("ChatArea: Received bluechat data:", data);

          // Handle agent_message events
          if (data.event === "agent_message" && data.answer) {
            finalAssistantContent += data.answer;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantMessage.id
                  ? { ...msg, content: msg.content + data.answer }
                  : msg
              )
            );
          }

          // Collect xiaohongshu_content data for database storage
          if (data.type === "xiaohongshu_content" && typeof data.content === "string") {
            console.log(
              "ChatArea: Collecting xiaohongshu content data for storage:",
              data.content.substring(0, 100)
            );
            cardsDataToSave.push({
              project_id: projectId,
              title: data.title,
              content: data.content,
            });
          }

          // Collect canvas data for database storage
          if (data.keyword && data.cards && Array.isArray(data.cards)) {
            console.log(
              "ChatArea: Collecting canvas data for storage:",
              data.keyword,
              data.cards.length
            );
            data.cards.forEach((card: Record<string, unknown>) => {
              canvasDataToSave.push({
                project_id: projectId,
                external_id: typeof card.id === 'string' ? card.id : '',
                type: "canvas",
                title: typeof card.title === 'string' ? card.title : '',
                content: typeof card.content === 'string' ? card.content : "",
                keyword: typeof data.keyword === 'string' ? data.keyword : '',
                author: typeof card.author === 'string' ? card.author : "",
                author_avatar: typeof card.author_avatar === 'string' ? card.author_avatar : "",
                like_count: typeof card.like_count === 'number' ? card.like_count : 0,
                collect_count: typeof card.collect_count === 'number' ? card.collect_count : 0,
                comment_count: typeof card.comment_count === 'number' ? card.comment_count : 0,
                share_count: typeof card.share_count === 'number' ? card.share_count : 0,
                cover_url: typeof card.cover_url === 'string' ? card.cover_url : "",
                url: typeof card.url === 'string' ? card.url : "",
                platform: typeof card.platform === 'string' ? card.platform : "xiaohongshu",
                ip_location: typeof card.ip_location === 'string' ? card.ip_location : "",
                tags: Array.isArray(card.tags) ? card.tags : [],
                create_time: typeof card.create_time === 'string' ? card.create_time : "",
              });
            });
          }

          // Collect keyword_insight data for database storage
          if (
            (typeof data.answerText === 'string' && data.type === "keyword_insight") ||
            (typeof data.answerText === 'string' && data.type === "comprehensive_insight")
          ) {
            console.log(
              "ChatArea: Collecting keyword insight data for storage:",
              data.answerText.substring(0, 100)
            );
            insightsDataToSave.push({
              project_id: projectId,
              external_id: typeof data.id === 'string' ? data.id : `insight-${Date.now()}`,
              type: "keyword_insight",
              title: typeof data.keyword === 'string' ? `关键词洞察: ${data.keyword}` : "全面洞察",
              content: data.answerText,
            });
          }

          // Process stream data for cards store
          processCardsStreamData(data);

          // 如果检测到小红书内容，自动切换到小红书标签页
          if (data.type === "xiaohongshu_content" && writingAreaRef?.current?.switchToXiaohongshuTab) {
            writingAreaRef.current.switchToXiaohongshuTab();
          }

          // Forward canvas data to CanvasArea
          if (onCanvasDataReceived) {
            onCanvasDataReceived(data);
          }
        }
      );

      // 2. 保存canvas数据到数据库
      if (canvasDataToSave.length > 0) {
        try {
          console.log(
            "ChatArea: Saving canvas data to database:",
            canvasDataToSave.length
          );
          await saveCanvasData(projectId, canvasDataToSave as any[]);
          console.log("ChatArea: Canvas data saved successfully");
        } catch (canvasError) {
          console.error("ChatArea: Failed to save canvas data:", canvasError);
          toast({
            title: "Canvas数据保存失败",
            description: "Canvas数据未能保存到数据库",
            variant: "destructive",
          });
        }
      }

      // 3. 保存insights数据到数据库
      if (insightsDataToSave.length > 0) {
        try {
          console.log(
            "ChatArea: Saving insights data to database:",
            insightsDataToSave.length
          );
          await saveInsightsData(projectId, insightsDataToSave as any[]);
          console.log("ChatArea: Insights data saved successfully");
        } catch (insightsError) {
          console.error(
            "ChatArea: Failed to save insights data:",
            insightsError
          );
          toast({
            title: "Insights数据保存失败",
            description: "Insights数据未能保存到数据库",
            variant: "destructive",
          });
        }
      }

      // 4. 保存小红书内容数据到数据库
      if (cardsDataToSave.length > 0) {
        try {
          console.log(
            "ChatArea: Saving xiaohongshu content data to database:",
            cardsDataToSave.length
          );

          await saveXiaohongshuData(projectId, cardsDataToSave as any[]);
          console.log("ChatArea: Xiaohongshu content data saved successfully");
        } catch (cardsError) {
          console.error(
            "ChatArea: Failed to save xiaohongshu content data:",
            cardsError
          );
          toast({
            title: "小红书内容保存失败",
            description: "小红书内容数据未能保存到数据库",
            variant: "destructive",
          });
        }
      }

      // 5. 保存助手消息到数据库
      if (finalAssistantContent.trim()) {
        const savedAssistantMessage = await chatApi.saveMessage(
          projectId,
          "assistant",
          finalAssistantContent
        );
        console.log(
          "ChatArea: Assistant message saved:",
          savedAssistantMessage.id
        );

        // Update temp assistant message with real ID and mark as complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMessage.id
              ? { ...msg, id: savedAssistantMessage.id, isStreaming: false }
              : msg
          )
        );
      } else {
        // Mark streaming as complete even if no content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMessage.id
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }

      setReferences([]);
      setPendingSystemMessages([]);

      toast({
        title: "搜索完成",
        description: "Canvas 数据已更新",
      });
    } catch (error: unknown) {
      console.error('ChatArea: Failed to send message:', error);
      toast({
        title: "发送失败",
        description: (error instanceof Error ? error.message : String(error)) || "无法发送消息，请重试",
        variant: "destructive"
      });
      // Remove both user and assistant messages on error
      setMessages(prev => prev.slice(0, -2));
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

  const handleMessageClick = (message: StreamingMessage) => {
    setSelectedMessage(message);
    setIsMessageDialogOpen(true);
  };

  const closeMessageDialog = () => {
    setIsMessageDialogOpen(false);
    setSelectedMessage(null);
  };

  const renderStreamingContent = (message: StreamingMessage) => {
    console.log('ChatArea: Rendering streaming content:', {
      thoughts: message.thoughts?.length || 0,
      toolCalls: message.toolCalls?.length || 0,
      contentLength: message.content?.length || 0,
      isStreaming: message.isStreaming
    });

    return (
      <div className="space-y-4">
        {/* 初始连接指示器 - 只在没有任何内容时显示 */}
        {message.isStreaming && !message.thoughts?.length && !message.toolCalls?.length && !message.content && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium">Nova 正在思考中...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thoughts - 实时显示思考过程 */}
        {message.thoughts && message.thoughts.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                🤔 AI 思考过程
                {message.isStreaming && (
                  <div className="flex gap-1 ml-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {message.thoughts.map((thought, index) => (
                  <div 
                    key={index} 
                    className="text-sm text-amber-800 leading-relaxed p-3 bg-white/60 rounded-lg border border-amber-100 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="text-amber-600 font-medium mr-2">#{index + 1}</span>
                    {thought}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Tool Calls - 工具调用实时显示 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-3">
            {message.toolCalls
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((toolCall, index) => (
                <Card key={toolCall.id || index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm animate-fadeIn">
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                      🔧 工具调用: {toolCall.tool.split(';').join(', ')}
                      {!toolCall.observation && (
                        <div className="flex gap-1 ml-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        </div>
                      )}
                    </div>
                    
                    {toolCall.tool_input && (
                      <div className="bg-white/80 rounded-lg p-3 text-xs font-mono mb-3 border border-green-100">
                        <div className="text-green-600 font-semibold mb-2">输入参数:</div>
                        <div className="whitespace-pre-wrap text-green-800 leading-relaxed">{toolCall.tool_input}</div>
                      </div>
                    )}
                    
                    {toolCall.observation ? (
                      <div className="bg-white rounded-lg p-3 text-sm border border-green-200 animate-fadeIn">
                        <div className="text-green-600 font-semibold mb-2 flex items-center gap-2">
                          ✓ 执行结果:
                        </div>
                        <div className="text-green-800 whitespace-pre-wrap leading-relaxed">{toolCall.observation}</div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3 text-sm border border-yellow-200">
                        <div className="text-yellow-600 font-semibold mb-2 flex items-center gap-2">
                          ⏳ 执行中...
                          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="text-yellow-700">正在处理工具调用...</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
        
        {/* Main Content - 主要回复内容实时显示 */}
        {message.content && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown 
                  className="prose prose-sm max-w-none text-black leading-relaxed prose-headings:text-black prose-p:text-black prose-strong:text-black prose-em:text-black prose-ul:text-black prose-ol:text-black prose-li:text-black prose-blockquote:text-black/70 prose-code:text-black prose-pre:bg-black/10 prose-pre:text-black"
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              
              {/* 流式传输光标 - 更显眼的动画效果 */}
              {message.isStreaming && (
                <div className="flex items-center mt-4 gap-2">
                  <div className="w-3 h-5 bg-blue-500 animate-pulse rounded-sm"></div>
                  <span className="text-xs text-blue-600 font-medium animate-pulse">正在输入...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 py-[8px] border-b border-black/20 bg-white">
        <h2 className="text-lg font-semibold text-black">Chat</h2>
      </div>

      {/* System Messages Indicator */}
      {pendingSystemMessages.length > 0 && (
        <div className="px-4 py-2 border-b border-black/20 rounded-xl bg-yellow-50 border border-yellow-200">
          <p className="text-xs text-yellow-700 font-medium">
            有 {pendingSystemMessages.length} 个编辑操作等待发送给AI
          </p>
        </div>
      )}

      {/* References Section */}
      {references.length > 0 && (
        <div className="border-t border-black/20 p-4 bg-white">
          <h3 className="text-sm font-medium text-black mb-3 flex items-center gap-2">
            <Link className="w-4 h-4" />
            引用内容 ({references.length})
          </h3>
          <div className="space-y-3">
            {references.map((ref, index) => (
              <div
                key={index}
                className="rounded-lg border border-black/20 p-3 text-sm bg-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-black truncate">
                        {ref.card_friendly_title}
                      </span>
                      <span className="text-xs text-black/50 bg-black/10 px-2 py-1 rounded">
                        {ref.type === "full_card" ? "整个卡片" : "文本片段"}
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
                        <p className="text-black/60 text-xs flex-1">
                          {ref.user_remark || "暂无备注"}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            startEditingRemark(index, ref.user_remark)
                          }
                          className="h-6 w-6 p-0 text-black/40 hover:text-black/60"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {ref.snippet_content && (
                      <div className="mt-2 p-2 bg-black/5 rounded text-xs text-black/60 border-l-2 border-black/20">
                        "{ref.snippet_content.substring(0, 100)}..."
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReference(index)}
                    className="h-6 w-6 p-0 text-black/40 hover:text-black flex-shrink-0"
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
      <div className="flex-1 overflow-auto bg-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-black/50 p-8">
            <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-black/40" />
            </div>
            <h3 className="text-lg font-medium text-black mb-2">
              开始与 Nova 对话
            </h3>
            <p className="text-sm text-center max-w-md">
              我是您的小红书内容创作助手，可以帮您撰写、优化和完善各种类型的小红书笔记内容。
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-4 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      | Nova
                    </div>

                    <div className="flex-1 min-w-0 max-w-4xl">
                      <div
                        className="cursor-pointer group relative"
                        onClick={() => handleMessageClick(message)}
                      >
                        {renderStreamingContent(message)}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Info className="w-4 h-4 text-black/40" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex justify-end min-w-0">
                      <div
                        onClick={() => handleMessageClick(message)}
                        className="whitespace-pre-wrap text-white leading-relaxed p-4 rounded-2xl transition-colors cursor-pointer group relative bg-black hover:bg-black/80 max-w-md"
                      >
                        {message.content}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Info className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-black/20 p-4 bg-white">
        {/* Canvas References Display */}
        <CanvasReferenceDisplay />

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入消息..."
              disabled={isLoading}
              className="min-h-[44px] max-h-[200px] resize-none bg-gray-100 py-4 rounded-2xl my-0"
            />
            {(references.length > 0 || pendingSystemMessages.length > 0) && (
              <p className="text-xs text-black/50 mt-2">
                将发送 {references.length} 个引用
                {pendingSystemMessages.length > 0 &&
                  ` 和 ${pendingSystemMessages.length} 个编辑通知`}{" "}
                给 AI
              </p>
            )}
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="h-11 w-11 p-0 bg-black hover:bg-black/80 disabled:bg-black/30 rounded-xl text-left text-white font-normal text-base px-[3px] py-[3px] my-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Message Details Dialog */}
      <MessageDetailsDialog
        message={selectedMessage}
        isOpen={isMessageDialogOpen}
        onClose={closeMessageDialog}
      />
    </div>
  );
});

ChatArea.displayName = "ChatArea";
