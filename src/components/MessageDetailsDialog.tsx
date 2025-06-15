
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  llm_raw_output?: any;
  created_at: string;
}

interface MessageDetailsDialogProps {
  message: ChatMessage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MessageDetailsDialog = ({ message, isOpen, onClose }: MessageDetailsDialogProps) => {
  const { toast } = useToast();

  if (!message) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "复制成功",
      description: `${label}已复制到剪贴板`,
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl border-0">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-serif font-semibold text-gray-900 flex items-center gap-3">
              {message.role === 'assistant' ? (
                <Bot className="w-6 h-6 text-gray-700" />
              ) : (
                <User className="w-6 h-6 text-gray-700" />
              )}
              消息详情
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-serif">
                {message.role === 'assistant' ? 'AI回复' : '用户消息'}
              </Badge>
              <Badge variant="outline" className="text-xs font-serif text-gray-500">
                {formatTimestamp(message.created_at)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* 显示内容 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-medium text-gray-900">显示内容</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(message.content, "显示内容")}
                  className="text-gray-500 hover:text-gray-700 rounded-xl"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </Button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                  {message.content}
                </pre>
              </div>
            </div>

            {/* AI原始输出 (仅对AI消息显示) */}
            {message.role === 'assistant' && message.llm_raw_output && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif font-medium text-gray-900">AI原始输出</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.llm_raw_output, "AI原始输出")}
                    className="text-gray-500 hover:text-gray-700 rounded-xl"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {typeof message.llm_raw_output === 'string' ? message.llm_raw_output : JSON.stringify(message.llm_raw_output, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 消息元数据 */}
            <div className="space-y-3">
              <h3 className="text-lg font-serif font-medium text-gray-900">消息信息</h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">消息ID:</span>
                    <span className="ml-2 text-gray-800 font-mono">{message.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">角色:</span>
                    <span className="ml-2 text-gray-800">{message.role}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">创建时间:</span>
                    <span className="ml-2 text-gray-800">{formatTimestamp(message.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
