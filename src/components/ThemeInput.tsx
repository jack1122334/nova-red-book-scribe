
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ThemeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const ThemeInput: React.FC<ThemeInputProps> = ({
  value,
  onChange,
  onSubmit
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-black focus-within:ring-opacity-10">
        <div className="flex items-center p-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入主题..."
            className="flex-1 border-0 bg-transparent text-lg font-serif placeholder:text-gray-400 focus:ring-0 focus:outline-none shadow-none px-6 py-4"
          />
          <Button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="mr-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 rounded-xl px-6 py-3 transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
